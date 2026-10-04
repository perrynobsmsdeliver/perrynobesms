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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existing } = await supabase
     .from("transactions")
     .select("id")
     .eq("reference", reference)
     .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, msg: "Already processed" });
    }

    // Reference format: fund_TIMESTAMP_userId_random
    const parts = reference.split("_");
    let userId: string | null = parts.length >= 3? parts[2] : null;

    // Fallback: try metadata
    if (!userId && data.metadata?.user_id) {
      userId = data.metadata.user_id as string;
    }

    if (!userId) {
      console.log("Webhook: no userId for", reference);
      return NextResponse.json({ ok: true });
    }

    const { data: wallet } = await supabase
     .from("wallets")
     .select("balance")
     .eq("user_id", userId)
     .maybeSingle();

    if (wallet) {
      await supabase
       .from("wallets")
       .update({ balance: (wallet.balance as number) + amount, updated_at: new Date().toISOString() })
       .eq("user_id", userId);
    } else {
      await supabase.from("wallets").insert({ user_id: userId, balance: amount });
    }

    await supabase.from("transactions").insert({
      user_id: userId,
      amount: amount,
      reference: reference,
      type: "funding",
      status: "success",
    });
  }

  return NextResponse.json({ ok: true });
}
