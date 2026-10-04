import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { orderId } = await req.json();
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // refund using user_id INSIDE order
  const { data: wallet } = await admin.from("wallets").select("balance").eq("user_id", order.user_id).single();
  const newBal = (wallet?.balance || 0) + order.price;
  
  await admin.from("wallets").update({ balance: newBal }).eq("user_id", order.user_id);
  await admin.from("orders").update({ status: "cancelled" }).eq("id", orderId);

  return NextResponse.json({ success: true, balance: newBal });
}
