export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY!;
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  // Verify Paystack signature
  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
  if (hash!== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const data = event.data;
    const reference = data.reference;
    const amount = data.amount / 100; // Paystack sends in kobo
    const email = data.customer.email;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if already processed
    const { data: existing } = await supabase
     .from("transactions")
     .select("id")
     .eq("reference", reference)
     .single();

    if (existing) {
      return NextResponse.json({ ok: true, msg: "Already processed" });
    }

    // Find user by email via auth.users? We store transactions with user_id, so we need to find user_id from wallet? Better: reference contains user_id.
    // Our reference is: fund_xxxx_userId_timestamp - so extract userId
    // Fallback: find user from auth

    // Extract user_id from reference if we encoded it
    // Example ref: fund_abc123_user123_1234567890
    const parts = reference.split("_");
    let userId = parts.length >= 3? parts[2] : null;

    // If no userId in ref, try to find via email
    if (!userId) {
      const { data: authUser } = await supabase.auth.admin.listUsers();
      const user = authUser.users.find(u => u.email === email);
      if (user) userId = user.id;
    }

    if (!userId) {
      console.log("Webhook: no userId for ref", reference);
      return NextResponse.json({ ok: false });
    }

    // Credit wallet
    const { data: wallet } = await supabase
     .from("wallets")
     .select("balance")
     .eq("user_id", userId)
     .single();

    if (wallet) {
      await supabase
       .from("wallets")
       .update({ balance: wallet.balance + amount, updated_at: new Date().toISOString() })
       .eq("user_id", userId);
    } else {
      await supabase.from("wallets").insert({ user_id: userId, balance: amount });
    }

    // Log transaction
    await supabase.from("transactions").insert({
      user_id: userId,
      amount: amount,
      reference: reference,
      type: "funding",
      status: "success",
    });

    console.log(`Webhook credited ₦${amount} to ${userId}`);
  }

  return NextResponse.json({ ok: true });
}
