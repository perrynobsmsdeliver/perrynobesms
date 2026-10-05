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

    // Get order with fivesim_id
    const {data: order} = await supabase.from("orders").select("*").eq("id", orderId).single();
    if(!order) return NextResponse.json({error:"Order not found"}, {status:404});

    // Cancel on 5sim using fivesim_id, NOT your orderId
    const fivesimId = order.fivesim_id || order.provider_id;
    await fetch(`https://5sim.net/v1/user/cancel/${fivesimId}`, {
      headers:{Authorization:`Bearer ${KEY}`}
    });

    // Refund to wallet
    const {data: wallet} = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
    const newBal = (wallet?.balance || 0) + (order.sold_price || order.price);
    await supabase.from("wallets").update({balance:newBal}).eq("user_id", user_id);
    await supabase.from("orders").update({status:"cancelled"}).eq("id", orderId);

    return NextResponse.json({balance:newBal});
  }catch(e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}
