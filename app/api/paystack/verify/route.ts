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
    return NextResponse.redirect(new URL("/?fund=failed", req.url));
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
        // GET current balance correctly
        const { data: w } = await supabase.from("wallets").select("balance").eq("user_id", user_id).maybeSingle();
        const currentBal = w?.balance || 0;
        const newBal = currentBal + amount;

        await supabase.from("wallets").upsert({ 
          user_id: user_id, 
          balance: newBal,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });

        // Avoid double credit
        const { data: existing } = await supabase.from("transactions").select("id").eq("reference", reference).maybeSingle();
        if(!existing){
          await supabase.from("transactions").insert({
            user_id: user_id,
            amount: amount,
            type: "deposit",
            status: "success",
            reference: reference,
            description: `Wallet funding - ${reference}`
          });
        }
      }
      return NextResponse.redirect(new URL(`/?fund=success&amount=${amount}`, req.url));
    }
  }catch(e){
    console.log("verify error", e);
  }

  return NextResponse.redirect(new URL("/?fund=failed", req.url));
}
