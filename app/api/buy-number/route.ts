import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest){
  const supabase = getSupabaseAdmin();
  if(!supabase) return NextResponse.json({error:"Server ENV missing"}, {status:500});

  try {
    const body = await req.json();
    const { country, service, user_id, price } = body;

    if(!user_id) return NextResponse.json({error:"Not logged in - no user_id"}, {status:401});
    if(!country || !service) return NextResponse.json({error:"Missing country/service"}, {status:400});

    // 1. Check wallet
    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
    if(!wallet || wallet.balance < price) return NextResponse.json({error:`Insufficient balance. You have ₦${wallet?.balance || 0} need ₦${price}`}, {status:400});

    // 2. Call SMS Provider (Mock for now - replace with your real API later)
    // TODO: Replace with DaizySMS / 5sim API
    const phone = `+1${Math.floor(1000000000 + Math.random()*9000000000)}`;
    const otp = `${Math.floor(100000 + Math.random()*900000)}`;

    // 3. Deduct balance
    await supabase.from("wallets").update({ balance: wallet.balance - price }).eq("user_id", user_id);

    // 4. Save order (if you have orders table)
    // await supabase.from("orders").insert({ user_id, country, service, phone, price, status:"active" });

    return NextResponse.json({ success:true, phone, otp, message:"Number bought!" });

  } catch(e:any){
    return NextResponse.json({error: e.message}, {status:500});
  }
}
