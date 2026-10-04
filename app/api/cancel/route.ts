import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "orderId missing" }, { status: 400 });

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find order by id OR fivesim_id OR provider_id (covers all)
    let { data: order } = await admin.from("orders").select("*").eq("id", orderId).single();
    if (!order) {
      const { data: a } = await admin.from("orders").select("*").eq("fivesim_id", orderId).single();
      if(a) order = a as any;
    }
    if (!order) {
      const { data: b } = await admin.from("orders").select("*").eq("provider_id", orderId).single();
      if(b) order = b as any;
    }
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Prevent double refund
    if (order.status === "CANCELLED" || order.status === "cancelled" || order.status === "COMPLETED") {
      return NextResponse.json({ error: "Already cancelled/completed", status: order.status }, { status: 400 });
    }

    const refundAmount = Number(order.sold_price || order.price) || 0;
    const { data: wallet } = await admin.from("wallets").select("balance").eq("user_id", order.user_id).single();
    const newBal = (Number(wallet?.balance) || 0) + refundAmount;

    await admin.from("wallets").update({ balance: newBal }).eq("user_id", order.user_id);
    await admin.from("orders").update({ status: "CANCELLED" }).eq("id", order.id);

    // Cancel on 5sim side too - try both ids
    const fiveId = order.fivesim_id || order.provider_id;
    try {
      if(fiveId){
        await fetch(`https://5sim.net/v1/user/cancel/${fiveId}`, {
          headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}` }
        });
      }
    } catch {}

    return NextResponse.json({ success: true, balance: newBal });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
