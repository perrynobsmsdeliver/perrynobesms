import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url,key, { auth: { persistSession: false } });
}

export async function POST(req:NextRequest){
  const supabase=getAdmin();
  const {orderId, user_id} = await req.json();

  const {data:order} = await supabase.from("orders").select("*").eq("id",orderId).single();
  if(!order) return NextResponse.json({error:"Order not found"}, {status:400});

  // refund to wallets table
  const {data:wallet} = await supabase.from("wallets").select("balance").eq("user_id",user_id).single();
  const newBal = (wallet?.balance || 0) + order.price;

  await supabase.from("wallets").update({balance:newBal}).eq("user_id",user_id);
  await supabase.from("profiles").update({balance:newBal}).eq("id",user_id); // make both match
  
  await supabase.from("orders").update({status:"cancelled"}).eq("id",orderId);

  return NextResponse.json({balance:newBal, message:"Refunded"});
}
