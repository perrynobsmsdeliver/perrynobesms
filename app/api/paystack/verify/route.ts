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
  const userIdFromUrl = req.nextUrl.searchParams.get("userId");
  
  // FIXED - use current domain automatically, no more hardcoded 404
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  
  if(!reference){
    return NextResponse.redirect(`${siteUrl}/dashboard?fund=failed`);
  }

  try{
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      cache: 'no-store'
    });
    const data = await res.json();

    if(data.status && data.data?.status === "success"){
      const amount = data.data.amount / 100;
      const user_id = data.data.metadata?.user_id || userIdFromUrl;

      if(user_id){
        const { data: existing } = await supabase.from("transactions").select("id").eq("reference", reference).maybeSingle();
        if(!existing){
          const { data: w } = await supabase.from("wallets").select("balance").eq("user_id", user_id).maybeSingle();
          const currentBal = w?.balance || 0;
          const newBal = currentBal + amount;

          await supabase.from("wallets").upsert({ 
            user_id: user_id, 
            balance: newBal,
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id" });

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
      return NextResponse.redirect(`${siteUrl}/dashboard?pay=success&funded=${amount}`);
    }
  }catch(e){
    console.log("verify error", e);
  }

  return NextResponse.redirect(`${siteUrl}/dashboard?fund=failed`);
}
