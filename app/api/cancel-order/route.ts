import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin(){
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.SUPABASE_SERVICE_ROLE_KEY!, 
    { auth:{persistSession:false} }
  );
}
const KEY = process.env.FIVESIM_API_KEY!;

export async function POST(req:NextRequest){
  try{
    const supabase = getAdmin();
    const body = await req.json();
    const orderId = body.orderId;
    const user_id = body.user_id;
    if(!orderId || !user_id) return NextResponse.json({error:"Missing data"}, {status:400});
    
    let { data: order } = await supabase.from("orders").select("*").eq("id", orderId).eq("user_id", user_id).maybeSingle();
    if(!order){
      const r = await supabase.from("orders").select("*").eq("fivesim_id", String(orderId)).eq("user_id", user_id).maybeSingle();
      order = r.data;
    }
    if(!order) return NextResponse.json({error:"Order not found"}, {status:404});
    
    if(order.status === "cancelled") {
      const {data: w} = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
      return NextResponse.json({success:true, balance: w?.balance || 0});
    }

    const { data: locked } = await supabase.from("orders").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", order.id).select("*").single();

    const fivesimId = locked?.fivesim_id || locked?.provider_id;
    if(fivesimId){
      try{ await fetch(`https://5sim.net/v1/user/cancel/${fivesimId}`, { headers:{Authorization:`Bearer ${KEY}`} }); }catch{}
    }

    const refundAmount = Number(locked?.price || locked?.sold_price || locked?.cost || order.price || 0);
    if(refundAmount <= 0) return NextResponse.json({error:"Refund 0"}, {status:500});

    const { data: walletBefore } = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
    const oldBalance = Number(walletBefore?.balance || 0);
    const newBalance = oldBalance + refundAmount;

    await supabase.from("wallets").update({ balance: newBalance, updated_at: new Date().toISOString() }).eq("user_id", user_id);
    
    return NextResponse.json({success:true, balance:newBalance, refunded: refundAmount});
  }catch(e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}
