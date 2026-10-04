import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

function isUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "orderId missing" }, { status: 400 });

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let order: any = null;

    // 1. Try by UUID only if it looks like UUID
    if (isUUID(orderId)) {
      const { data } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
      if (data) order = data;
    }

    // 2. Try by fivesim_id
    if (!order) {
      const { data } = await admin.from("orders").select("*").eq("fivesim_id", orderId).maybeSingle();
      if (data) order = data;
    }

    // 3. Try by provider_id
    if (!order) {
      const { data } = await admin.from("orders").select("*").eq("provider_id", orderId).maybeSingle();
      if (data) order = data;
    }

    // 4. Try by provider_id as number
    if (!order) {
      const { data } = await admin.from("orders").select("*").eq("provider_id", String(orderId)).maybeSingle();
      if (data) order = data;
    }

    if (!order) return NextResponse.json({ error: "Order not found for ID: " + orderId }, { status: 404 });

    if (order.status === "CANCELLED" || order.status === "cancelled") {
      return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
    }

    const refundAmount = Number(order.sold_price || order.price) || 0;

    const { data: wallet } = await admin.from("wallets").select("balance").eq("user_id", order.user_id).maybeSingle();
    const newBal = (Number(wallet?.balance) || 0) + refundAmount;

    await admin.from("wallets").update({ balance: newBal }).eq("user_id", order.user_id);
    await admin.from("orders").update({ status: "CANCELLED" }).eq("id", order.id);

    // Cancel on 5sim
    const fiveId = order.fivesim_id || (order as any).provider_id || orderId;
    try {
      await fetch(`https://5sim.net/v1/user/cancel/${fiveId}`, {
        headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}` }
      });
    } catch {}

    return NextResponse.json({ success: true, balance: newBal });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
