// @ts-nocheck
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest){
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const reference = req.nextUrl.searchParams.get("reference");
  if(!reference){
    return NextResponse.redirect(new URL("/?fund=failed", req.url), 302);
  }

  try{
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      cache: 'no-store'
    });
    const data = await res.json();

    if(data.status && data.data?.status === "success"){
      const amount = data.data.amount / 100;
      const user_id = data.data.metadata?.user_id;

      if(user_id){
        const { data: w } = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
        const newBal = (w?.balance || 0) + amount;
        await supabase.from("wallets").upsert({ user_id, balance: newBal }, { onConflict: 'user_id' });
        await supabase.from("transactions").insert({ user_id, amount, reference, type: 'deposit', status: 'success' });
      }
      
      return NextResponse.redirect(new URL(`/?fund=success&amount=${amount}`, req.url), 302);
    }
  }catch(e){
    console.log("verify error", e);
  }

  return NextResponse.redirect(new URL("/?fund=failed", req.url), 302);
}
