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
    if(!order) return NextResponse.json({success:true, balance:null}); // FIX: clear UI even if not found
    if(order.status === "cancelled") {
      const {data: w} = await supabase.from("wallets").select("balance").eq("user_id", order.user_id).single();
      return NextResponse.json({success:true, balance:w?.balance});
    }
    const fivesimId = order.fivesim_id || order.provider_id;
    try{ await fetch(`https://5sim.net/v1/user/cancel/${fivesimId}`, { headers:{Authorization:`Bearer ${KEY}`} }); }catch{}
    const finalUserId = user_id || order.user_id;
    const {data: wallet} = await supabase.from("wallets").select("balance").eq("user_id", finalUserId).single();
    const newBal = (wallet?.balance || 0) + (order.sold_price || order.price || 0);
    await supabase.from("wallets").update({balance:newBal}).eq("user_id", finalUserId);
    await supabase.from("orders").update({status:"cancelled"}).eq("id", orderId);
    return NextResponse.json({success:true, balance:newBal});
  }catch(e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}
