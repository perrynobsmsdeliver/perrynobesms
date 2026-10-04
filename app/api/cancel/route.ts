import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin(){
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req:NextRequest){
  try{
    const admin = getAdmin();
    const { orderId, user_id } = await req.json();
    
    console.log("CANCEL REQUEST", orderId, user_id);

    const { data: order } = await admin.from("orders").select("*").eq("id", orderId).single();
    if(!order) return NextResponse.json({error:"Order not found"}, {status:404});
    
    if(order.status === "cancelled"){
      return NextResponse.json({error:"Already cancelled"}, {status:400});
    }

    // 1. Get REAL balance from wallets only
    const { data: wallet, error:wErr } = await admin.from("wallets").select("balance").eq("user_id", user_id).single();
    if(wErr) return NextResponse.json({error:"Wallet error: "+wErr.message}, {status:500});
    
    const newBal = (wallet.balance || 0) + order.price;

    // 2. Update ONLY wallets - no profiles again
    const { error: uErr } = await admin.from("wallets").update({ balance: newBal }).eq("user_id", user_id);
    if(uErr) return NextResponse.json({error:"Refund failed: "+uErr.message}, {status:500});

    // 3. Mark order cancelled
    await admin.from("orders").update({ status: "cancelled" }).eq("id", orderId);

    // 4. Cancel on 5sim (no worry if e fail)
    try{
      await fetch(`https://5sim.net/v1/user/cancel/${order.provider_id}`, {
        headers:{ Authorization:`Bearer ${process.env.FIVESIM_API_KEY}` }
      });
    }catch{}

    return NextResponse.json({ success:true, balance:newBal, message:`₦${order.price} refunded` });
    
  }catch(e:any){
    console.log("CANCEL ERROR", e);
    return NextResponse.json({error:e.message}, {status:500});
  }
}
