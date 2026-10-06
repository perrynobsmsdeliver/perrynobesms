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
    
    // 1. Find order by BOTH id and fivesim_id
    let { data: order } = await supabase.from("orders").select("*").eq("id", orderId).eq("user_id", user_id).maybeSingle();
    if(!order){
      const r = await supabase.from("orders").select("*").eq("fivesim_id", String(orderId)).eq("user_id", user_id).maybeSingle();
      order = r.data;
    }
    if(!order){
      const r2 = await supabase.from("orders").select("*").eq("provider_id", String(orderId)).eq("user_id", user_id).maybeSingle();
      order = r2.data;
    }

    if(!order) return NextResponse.json({error:"Order not found"}, {status:404});
    if(order.status === "cancelled") {
      const {data: w} = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
      return NextResponse.json({success:true, balance:w?.balance, alreadyCancelled:true});
    }

    // 2. Lock it - only if still active
    const { data: locked, error: lockError } = await supabase
      .from("orders")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", order.id)
      .in("status", ["waiting_sms", "active", "sms_received", "pending", "waiting"])
      .select("user_id, sold_price, price, fivesim_id, provider_id")
      .single();

    if(lockError || !locked){
      const {data: w} = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
      return NextResponse.json({success:true, balance:w?.balance, alreadyCancelled: true});
    }

    // 3. Cancel on 5sim
    const fivesimId = locked.fivesim_id || locked.provider_id || order.fivesim_id;
    if(fivesimId){
      try{ 
        await fetch(`https://5sim.net/v1/user/cancel/${fivesimId}`, { headers:{Authorization:`Bearer ${KEY}`} }); 
      }catch{}
    }

    const refundAmount = locked.sold_price || locked.price || order.sold_price || order.price || 0;

    // 4. ATOMIC REFUND
    const { error: walletError } = await supabase.rpc('increment_wallet', {
      p_user_id: user_id,
      p_amount: refundAmount
    });

    if(walletError){
      console.error("WALLET REFUND FAILED", walletError);
      // Rollback order status if refund fails
      await supabase.from("orders").update({ status: order.status }).eq("id", order.id);
      return NextResponse.json({error:"Refund failed, contact admin"}, {status:500})
    }

    const {data: w} = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
    
    return NextResponse.json({success:true, balance:w?.balance, refunded: refundAmount});
    
  }catch(e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}
