export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY!;
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
  if (hash!== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const data = event.data;
    const reference: string = data.reference;
    const amount = data.amount / 100;
    const email: string | undefined = data.customer?.email?.toLowerCase();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Prevent double credit
    const { data: existing } = await supabase
    .from("transactions")
    .select("id")
    .eq("reference", reference)
    .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, msg: "Already processed" });
    }

    // 1. Try to get userId from reference OR metadata (for Card)
    const parts = reference.split("_");
    let userId: string | null = parts.length >= 3? parts[2] : null;
    if (!userId && data.metadata?.user_id) {
      userId = data.metadata.user_id as string;
    }

    // 2. FALLBACK for Bank Transfer: get userId by email from Auth
    if (!userId && email) {
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData.users.find(u => u.email?.toLowerCase() === email);
      if (user) userId = user.id;
    }

    if (!userId) {
      console.log("Webhook: no userId found for", reference, email);
      // Still save transaction with email so you no lose record
      if (email) {
        await supabase.from("transactions").insert({
          user_email: email,
          type: "deposit",
          amount: amount,
          reference: reference,
        });
      }
      return NextResponse.json({ ok: true });
    }

    // 3. Update wallet (NO updated_at - your table no get am)
    const { data: wallet } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

    if (wallet) {
      await supabase
      .from("wallets")
      .update({ balance: (wallet.balance as number) + amount })
      .eq("user_id", userId);
    } else {
      await supabase.from("wallets").insert({ user_id: userId, balance: amount });
    }

    // 4. Insert transaction with CORRECT columns for YOUR table
    const { data: userInfo } = await supabase.auth.admin.getUserById(userId);
    const userEmail = userInfo.user?.email || email;

    if (userEmail) {
      await supabase.from("transactions").insert({
        user_email: userEmail,
        type: "deposit",
        amount: amount,
        reference: reference,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
