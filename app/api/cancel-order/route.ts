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
    
    // 1. ATOMIC LOCK - Only one request can win, even with double-click
    // This replaces your SELECT + check
    const { data: locked, error: lockError } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId)
      .in("status", ["waiting_sms", "active", "sms_received", "pending"]) // only allow cancel from active states
      .select("user_id, sold_price, price, fivesim_id, provider_id")
      .single();

    if(lockError || !locked){
      // Already cancelled, completed, or not found - safe exit, NO REFUND
      const { data: order } = await supabase.from("orders").select("user_id").eq("id", orderId).single();
      const uid = user_id || order?.user_id;
      const {data: w} = await supabase.from("wallets").select("balance").eq("user_id", uid).single();
      return NextResponse.json({success:true, balance:w?.balance, alreadyCancelled: true});
    }

    // 2. Now cancel on 5sim (doesn't matter if it fails, we already locked)
    const fivesimId = locked.fivesim_id || locked.provider_id;
    try{ 
      await fetch(`https://5sim.net/v1/user/cancel/${fivesimId}`, { headers:{Authorization:`Bearer ${KEY}`} }); 
    }catch{}

    const finalUserId = user_id || locked.user_id;
    const refundAmount = locked.sold_price || locked.price || 0;

    // 3. ATOMIC WALLET INCREMENT - no race condition
    const { error: walletError } = await supabase.rpc('increment_wallet', {
      p_user_id: finalUserId,
      p_amount: refundAmount
    });

    if(walletError){
      // If wallet fails, we need to know - log it
      console.error("WALLET REFUND FAILED", walletError);
      // Don't rollback status, just return error so you can manually fix
      return NextResponse.json({error:"Refund failed, contact admin"}, {status:500})
    }

    const {data: w} = await supabase.from("wallets").select("balance").eq("user_id", finalUserId).single();
    
    return NextResponse.json({success:true, balance:w?.balance});
    
  }catch(e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}
