import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin(){
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req:NextRequest){
  const admin = getAdmin();
  const { orderId } = await req.json();
  
  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).single();
  if(!order) return NextResponse.json({error:"Order not found"}, {status:404});
  if(order.status === "cancelled") return NextResponse.json({error:"Already cancelled"}, {status:400});

  // Use user_id FROM ORDER, not from frontend - this is the fix
  const refundTo = order.user_id;
  
  const { data: wallet } = await admin.from("wallets").select("balance").eq("user_id", refundTo).single();
  const newBal = (wallet?.balance || 0) + order.price;

  console.log("REFUNDING", refundTo, "old", wallet?.balance, "new", newBal);

  const { error } = await admin.from("wallets").update({ balance: newBal }).eq("user_id", refundTo);
  if(error) return NextResponse.json({error:"Refund DB error: "+error.message}, {status:500});

  await admin.from("orders").update({ status: "cancelled" }).eq("id", orderId);

  try{
    await fetch(`https://5sim.net/v1/user/cancel/${order.provider_id}`, {
      headers:{ Authorization:`Bearer ${process.env.FIVESIM_API_KEY}` }
    });
  }catch{}

  return NextResponse.json({ success:true, balance:newBal });
}
