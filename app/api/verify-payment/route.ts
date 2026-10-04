import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { reference, amount, user_id, email } = await req.json();

    if (!reference || !amount || !user_id) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    // 1. Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}` },
      cache: "no-store"
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data?.status !== 'success') {
      return NextResponse.json({ success: false, error: "Paystack verification failed" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Prevent duplicate credit
    const { data: exists } = await supabaseAdmin.from("transactions").select("id").eq("reference", reference).maybeSingle();
    if (exists) {
      const { data: wallet } = await supabaseAdmin.from("wallets").select("balance").eq("user_id", user_id).single();
      return NextResponse.json({ success: true, new_balance: wallet?.balance || amount });
    }

    // 3. Insert transaction (with user_id - important!)
    await supabaseAdmin.from("transactions").insert({ 
      user_id,
      user_email: email, 
      reference, 
      amount, 
      type: 'deposit', 
      status: 'success' 
    });

    // 4. ADD to balance, NOT overwrite
    const { data: currentWallet } = await supabaseAdmin.from("wallets").select("balance").eq("user_id", user_id).maybeSingle();
    let newBalance = amount;
    
    if (currentWallet) {
      newBalance = currentWallet.balance + amount;
      await supabaseAdmin.from("wallets").update({ balance: newBalance }).eq("user_id", user_id);
    } else {
      await supabaseAdmin.from("wallets").insert({ user_id, balance: amount });
    }

    return NextResponse.json({ success: true, new_balance: newBalance });

  } catch (e: any) {
    console.error("verify error:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
