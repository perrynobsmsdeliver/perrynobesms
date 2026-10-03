import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(req: NextRequest){
  const reference = req.nextUrl.searchParams.get("reference");
  if(!reference) return NextResponse.redirect("https://perrynobesms.vercel.app/dashboard?fund=failed");

  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers:{ Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
  });
  const data = await res.json();
  
  if(data.status && data.data.status === "success"){
    const amount = data.data.amount / 100; // back to naira
    const user_id = data.data.metadata?.user_id;

    if(user_id){
      // add to wallet
      const { data: w } = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
      const newBal = (w?.balance || 0) + amount;
      await supabase.from("wallets").upsert({ user_id, balance: newBal });
    }
    return NextResponse.redirect(`https://perrynobesms.vercel.app/dashboard?fund=success&amount=${amount}`);
  }
  return NextResponse.redirect("https://perrynobesms.vercel.app/dashboard?fund=failed");
}
