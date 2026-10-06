import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin(){
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth:{persistSession:false} });
}
const KEY = process.env.FIVESIM_API_KEY!;

export async function POST(req:NextRequest){
  try{
    const supabase = getAdmin();
    const {orderId, user_id} = await req.json();
    if(!orderId || !user_id) return NextResponse.json({error:"Missing orderId or user_id"}, {status:400});
    
    let { data: order } = await supabase.from("orders").select("*").eq("id", orderId).eq("user_id", user_id).maybeSingle();
    if(!order){
      const r = await supabase.from("orders").select("*").eq("fivesim_id", String(orderId)).eq("user_id", user_id).maybeSingle();
      order = r.data;
    }
    if(!order) return NextResponse.json({error:"Order not found"}, {status:404});
    
    if(order.status === "cancelled") {
      const {data: w} = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
      return NextResponse.json({success:true, balance:w?.balance, alreadyCancelled:true});
    }

    const { data: locked } = await supabase
      .from("orders")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", order.id)
      .neq("status", "cancelled")
      .select("*")
      .single();

    if(!locked){
      const {data: w} = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
      return NextResponse.json({success:true, balance:w?.balance});
    }

    const fivesimId = locked.fivesim_id || locked.provider_id;
    if(fivesimId){
      try{ await fetch(`https://5sim.net/v1/user/cancel/${fivesimId}`, { headers:{Authorization:`Bearer ${KEY}`} }); }catch{}
    }

    // FIX: Check ALL possible column names - cost is most common
    const refundAmount = Number(locked.sold_price || locked.price || locked.cost || locked.amount || 0);
    
    if(refundAmount <= 0){
      console.error("Refund amount is 0! Order data:", locked);
      return NextResponse.json({error:"Refund amount is 0, check order cost column"}, {status:500});
    }

    const { data: walletBefore } = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
    const oldBalance = Number(walletBefore?.balance || 0);
    const newBalance = oldBalance + refundAmount;

    const { error: updateError } = await supabase
      .from("wallets")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("user_id", user_id);

    if(updateError){
      console.error("WALLET UPDATE ERROR:", updateError);
      return NextResponse.json({error:"Refund failed: " + updateError.message}, {status:500});
    }

    await supabase.from("transactions").insert({
      user_id,
      type: "refund",
      amount: refundAmount,
      description: `Refund order ${locked.id}`
    }).then(()=>{},()=>{});
    
    return NextResponse.json({success:true, balance:newBalance, refunded: refundAmount, oldBalance});
    
  }catch(e:any){
    console.error("CANCEL ERROR:", e);
    return NextResponse.json({error:e.message}, {status:500});
  }
}
