// @ts-nocheck
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest){
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const reference = req.nextUrl.searchParams.get("reference");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  if(!reference) return NextResponse.redirect(`${siteUrl}/dashboard?fund=failed`);
  try{
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }, cache: 'no-store'
    });
    const ps = await res.json();
    if(ps.status && ps.data?.status === "success"){
      const amount = ps.data.amount / 100;
      const user_id = ps.data.metadata?.user_id;
      if(!user_id) return NextResponse.redirect(`${siteUrl}/dashboard?fund=failed`);
      const { data: existing } = await supabase.from("transactions").select("id").eq("reference", reference).maybeSingle();
      if(!existing){
        const { data: w } = await supabase.from("wallets").select("balance").eq("user_id", user_id).maybeSingle();
        const newBal = (w?.balance || 0) + amount;
        await supabase.from("wallets").upsert({ user_id, balance: newBal, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
        await supabase.from("transactions").insert({ user_id, user_email: ps.data.customer.email, amount, type: "deposit", reference });
      }
      return NextResponse.redirect(`${siteUrl}/dashboard?pay=success&funded=${amount}`);
    }
  }catch(e){ console.log(e); }
  return NextResponse.redirect(`${siteUrl}/dashboard?fund=failed`);
}
