import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "orderId missing" }, { status: 400 });

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Try find by id first, then by provider_id (5sim id)
    let order = null;
    let { data } = await admin.from("orders").select("*").eq("id", orderId).single();
    if (data) order = data;
    else {
      const { data: byProvider } = await admin.from("orders").select("*").eq("provider_id", orderId).single();
      if (byProvider) order = byProvider;
    }

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const price = Number(order.price) || 0;

    const { data: wallet } = await admin.from("wallets").select("balance").eq("user_id", order.user_id).single();
    const currentBal = Number(wallet?.balance) || 0;
    const newBal = currentBal + price;

    const { error: walletErr } = await admin.from("wallets").update({ balance: newBal }).eq("user_id", order.user_id);
    if (walletErr) return NextResponse.json({ error: walletErr.message }, { status: 500 });

    await admin.from("orders").update({ status: "cancelled" }).eq("id", order.id);

    // Also cancel from 5sim if possible
    try {
      await fetch(`https://5sim.net/v1/user/cancel/${order.provider_id || orderId}`, {
        headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}` }
      });
    } catch {}

    return NextResponse.json({ success: true, balance: newBal });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
