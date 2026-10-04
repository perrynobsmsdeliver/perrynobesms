import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin(){
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(req:NextRequest){
  try{
    const supabase = getAdmin();
    const { orderId, user_id } = await req.json();

    // get order
    const {data:order} = await supabase.from("orders").select("*").eq("id", orderId).single();
    if(!order) return NextResponse.json({error:"Order not found"}, {status:400});

    // prevent double refund
    if(order.status === "cancelled"){
      return NextResponse.json({error:"Already refunded"}, {status:400});
    }

    // 1. Cancel on 5sim too
    try{
      await fetch(`https://5sim.net/v1/user/cancel/${order.provider_id}`, {
        headers:{ Authorization:`Bearer ${process.env.FIVESIM_API_KEY}` }
      });
    } catch{}

    // 2. Get current real wallet balance
    const {data:wallet} = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
    const current = wallet?.balance || 0;
    const newBal = current + order.price;

    // 3. UPDATE BOTH TABLES - THIS IS THE FIX
    const {error:wErr} = await supabase.from("wallets").update({balance:newBal}).eq("user_id", user_id);
    if(wErr) return NextResponse.json({error:"Wallet update failed: "+wErr.message}, {status:500});

    await supabase.from("profiles").update({balance:newBal}).eq("id", user_id);

    // 4. Mark order cancelled
    await supabase.from("orders").update({status:"cancelled"}).eq("id", orderId);

    return NextResponse.json({success:true, balance:newBal, message:`₦${order.price} refunded`});

  }catch(e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}
