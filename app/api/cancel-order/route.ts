import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin(){
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.SUPABASE_SERVICE_ROLE_KEY!, 
    { auth:{ persistSession:false } }
  );
}

const KEY = process.env.FIVESIM_API_KEY!;

export async function POST(req: NextRequest){
  try{
    const supabase = getAdmin();
    const { orderId, user_id } = await req.json();

    if(!orderId) return NextResponse.json({error:"No order ID"}, {status:400});

    // 1. Get order
    const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
    if(!order) return NextResponse.json({error:"Order not found in DB"}, {status:404});

    // 2. Prevent double refund
    if(order.status === "cancelled") {
      return NextResponse.json({ success: true, balance: null, message: "Already cancelled" });
    }

    const finalUserId = user_id || order.user_id;
    const fivesimId = order.fivesim_id || order.provider_id || orderId;

    // 3. Cancel on 5sim - treat "not found" as SUCCESS (already expired/cancelled)
    try {
      const res = await fetch(`https://5sim.net/v1/user/cancel/${fivesimId}`, {
        headers:{ Authorization:`Bearer ${KEY}`, Accept: "application/json" }
      });
      const txt = await res.text();
      console.log("5sim cancel:", fivesimId, txt);
      // Even if 5sim says not found, we continue to refund & clear UI
    } catch(e) {
      console.log("5sim cancel error, but continue refund:", e);
    }

    // 4. Refund to wallet
    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", finalUserId).single();
    const refundAmount = order.sold_price || order.price || 0;
    const newBal = (wallet?.balance || 0) + refundAmount;
    
    await supabase.from("wallets").update({ balance: newBal }).eq("user_id", finalUserId);
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);

    return NextResponse.json({ success: true, balance: newBal, refunded: refundAmount });

  } catch(e:any){
    console.error("Cancel error:", e);
    return NextResponse.json({error:e.message}, {status:500});
  }
}
