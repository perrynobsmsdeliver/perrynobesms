import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { reference } = await req.json();
    if(!reference) return NextResponse.json({ success: false }, { status: 400 });

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}` },
    });
    const ps = await verifyRes.json();
    if (!ps.status || ps.data?.status !== 'success') return NextResponse.json({ success: false }, { status: 400 });

    const realAmount = Math.floor(ps.data.amount / 100);
    const user_id = ps.data.metadata?.user_id;
    const email = ps.data.customer?.email;
    if(!user_id) return NextResponse.json({ success: false, error: "No user_id in metadata" }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: exists } = await supabase.from("transactions").select("id").eq("reference", reference).maybeSingle();
    if (exists) {
      const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
      return NextResponse.json({ success: true, new_balance: wallet?.balance, message: "Already credited" });
    }

    await supabase.from("transactions").insert({ user_id, user_email: email, reference, amount: realAmount, type: 'deposit' });
    const { data: currentWallet } = await supabase.from("wallets").select("balance").eq("user_id", user_id).maybeSingle();
    const newBalance = currentWallet ? Number(currentWallet.balance) + realAmount : realAmount;
    if (currentWallet) await supabase.from("wallets").update({ balance: newBalance, updated_at: new Date().toISOString() }).eq("user_id", user_id);
    else await supabase.from("wallets").insert({ user_id, balance: realAmount });

    return NextResponse.json({ success: true, new_balance: newBalance });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
