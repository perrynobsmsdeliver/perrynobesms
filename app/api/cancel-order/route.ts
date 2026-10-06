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
    
    // 1. ATOMIC LOCK + OWNERSHIP CHECK - Only owner can cancel, only once
    const { data: locked, error: lockError } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId)
      .eq("user_id", user_id) // <-- SECURITY FIX: prevents cancelling others' orders
      .in("status", ["waiting_sms", "active", "sms_received", "pending"])
      .select("user_id, sold_price, price, fivesim_id, provider_id")
      .single();

    if(lockError || !locked){
      // Already cancelled or not your order - NO REFUND, safe exit
      const {data: w} = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
      return NextResponse.json({success:true, balance:w?.balance, alreadyCancelled: true});
    }

    // 2. Cancel on 5sim
    const fivesimId = locked.fivesim_id || locked.provider_id;
    try{ 
      await fetch(`https://5sim.net/v1/user/cancel/${fivesimId}`, { headers:{Authorization:`Bearer ${KEY}`} }); 
    }catch{}

    const refundAmount = locked.sold_price || locked.price || 0;

    // 3. ATOMIC WALLET INCREMENT
    const { error: walletError } = await supabase.rpc('increment_wallet', {
      p_user_id: user_id,
      p_amount: refundAmount
    });

    if(walletError){
      console.error("WALLET REFUND FAILED", walletError);
      return NextResponse.json({error:"Refund failed, contact admin"}, {status:500})
    }

    const {data: w} = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
    
    return NextResponse.json({success:true, balance:w?.balance});
    
  }catch(e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}
