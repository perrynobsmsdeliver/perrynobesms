export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const { country, service, user_id, price } = await req.json();
    
    if(!user_id || !service || !country) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
    if (!wallet || wallet.balance < price) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    if(!process.env.FIVESIM_API_KEY){
      return NextResponse.json({ error: "FIVESIM_API_KEY not set in Vercel" }, { status: 500 });
    }

    const fiveRes = await fetch(`https://5sim.net/v1/user/buy/activation/${country}/any/${service}`, {
      headers: { 
        Authorization: `Bearer ${process.env.FIVESIM_API_KEY}`, 
        Accept: "application/json" 
      }
    });
    
    const fiveData = await fiveRes.json();
    
    if (!fiveRes.ok) {
      console.log("5sim error:", fiveData);
      return NextResponse.json({ error: fiveData.message || "5sim: Out of stock for this country/service" }, { status: 500 });
    }

    // Deduct wallet
    await supabase.from("wallets").update({ balance: wallet.balance - price }).eq("user_id", user_id);
    
    // Save order
    await supabase.from("orders").insert({
      user_id, 
      country, 
      service, 
      phone: fiveData.phone, 
      price, 
      order_id: String(fiveData.id), 
      status: "waiting_sms"
    });

    return NextResponse.json({ phone: fiveData.phone, id: fiveData.id, status: "waiting_sms" });
    
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
