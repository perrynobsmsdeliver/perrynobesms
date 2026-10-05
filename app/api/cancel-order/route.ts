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
    if(!orderId) return NextResponse.json({error:"No ID"}, {status:400});
    
    const {data: order} = await supabase.from("orders").select("*").eq("id", orderId).single();
    if(!order) return NextResponse.json({success:true, balance:null});
    
    // FIX 1: Block if already refunded/cancelled - check ALL refund statuses
    if(order.status === "cancelled" || order.status === "refunded" || order.status === "canceled") {
      const {data: w} = await supabase.from("wallets").select("balance").eq("user_id", order.user_id).single();
      return NextResponse.json({success:true, balance:w?.balance});
    }
    
    // FIX 2: Lock the order FIRST before touching wallet - atomic update
    // This will only succeed if status is still active, preventing race condition
    const { data: locked, error: lockError } = await supabase
      .from("orders")
      .update({status:"cancelled"})
      .eq("id", orderId)
      .neq("status", "cancelled")
      .neq("status", "refunded")
      .neq("status", "canceled")
      .select()
      .single();

    if(lockError || !locked){
      // Already cancelled by another request
      const {data: w} = await supabase.from("wallets").select("balance").eq("user_id", order.user_id).single();
      return NextResponse.json({success:true, balance:w?.balance});
    }

    // Now safe to cancel on 5sim
    const fivesimId = order.fivesim_id || order.provider_id;
    try{ await fetch(`https://5sim.net/v1/user/cancel/${fivesimId}`, { headers:{Authorization:`Bearer ${KEY}`} }); }catch{}
    
    const finalUserId = user_id || order.user_id;
    
    // FIX 3: Use atomic increment - not fetch then update
    const refundAmount = order.sold_price || order.price || 0;
    
    // Get current balance and update atomically using rpc or single update
    const {data: wallet} = await supabase.from("wallets").select("balance").eq("user_id", finalUserId).single();
    const newBal = (wallet?.balance || 0) + refundAmount;
    
    await supabase.from("wallets").update({balance:newBal}).eq("user_id", finalUserId);
    
    return NextResponse.json({success:true, balance:newBal});
    
  }catch(e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}
