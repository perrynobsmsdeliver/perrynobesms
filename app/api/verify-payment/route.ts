import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { reference, user_id, email } = await req.json();
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}` },
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.status || verifyData.data?.status !== 'success') {
      return NextResponse.json({ success: false, error: "Paystack verification failed" }, { status: 400 });
    }
    const realAmount = Math.floor(verifyData.data.amount / 100);
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    const { data: exists } = await supabaseAdmin.from("transactions").select("id").eq("reference", reference).maybeSingle();
    if (exists) {
      const { data: wallet } = await supabaseAdmin.from("wallets").select("balance").eq("user_id", user_id).single();
      return NextResponse.json({ success: true, new_balance: wallet?.balance || realAmount });
    }

    // YOUR table has: user_id, user_email, reference, amount, type
    await supabaseAdmin.from("transactions").insert({ user_id, user_email: email, reference, amount: realAmount, type: 'deposit' });
    
    const { data: currentWallet } = await supabaseAdmin.from("wallets").select("balance").eq("user_id", user_id).maybeSingle();
    let newBalance = realAmount;
    if (currentWallet) {
      newBalance = Number(currentWallet.balance) + realAmount;
      await supabaseAdmin.from("wallets").update({ balance: newBalance }).eq("user_id", user_id);
    } else {
      await supabaseAdmin.from("wallets").insert({ user_id, balance: realAmount });
    }
    return NextResponse.json({ success: true, new_balance: newBalance });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
