import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest){
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const reference = req.nextUrl.searchParams.get("reference");
  
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers:{ Authorization:`Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
  });
  const data = await res.json();
  if(data.data.status === "paid"){
    const user_id = data.data.metadata.user_id;
    const amount = data.data.amount / 100;
    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
    if(wallet){
      await supabase.from("wallets").update({ balance: wallet.balance + amount }).eq("user_id", user_id);
    }
  }
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}`);
}
