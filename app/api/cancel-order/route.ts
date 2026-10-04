import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    const idStr = String(orderId || "").trim();
    if (!idStr) return NextResponse.json({ error: "orderId missing" }, { status: 400 });
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    let order: any = null;
    const r1 = await admin.from("orders").select("*").eq("provider_id", idStr).maybeSingle();
    if (r1.data) order = r1.data;
    if (!order) {
      const r2 = await admin.from("orders").select("*").eq("fivesim_id", idStr).maybeSingle();
      if (r2.data) order = r2.data;
    }
    if (!order) {
      const r3 = await admin.from("orders").select("*").eq("id", idStr).maybeSingle();
      if (r3.data) order = r3.data;
    }
    if (!order) {
      try { await fetch(`https://5sim.net/v1/user/cancel/${idStr}`, { headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}` } }); } catch {}
      return NextResponse.json({ success: true, note: "force cancelled" });
    }
    if (order.status!== "active") return NextResponse.json({ error: "Already "+order.status }, { status: 400 });
    const refundAmount = Number(order.sold_price || order.price) || 0;
    const { data: wallet } = await admin.from("wallets").select("balance").eq("user_id", order.user_id).maybeSingle();
    const newBal = (Number(wallet?.balance) || 0) + refundAmount;
    await admin.from("wallets").update({ balance: newBal }).eq("user_id", order.user_id);
    await admin.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    try {
      const fiveId = order.fivesim_id || order.provider_id || idStr;
      await fetch(`https://5sim.net/v1/user/cancel/${fiveId}`, { headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}` } });
    } catch {}
    return NextResponse.json({ success: true, balance: newBal });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
