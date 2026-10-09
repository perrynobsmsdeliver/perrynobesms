import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const fiveSimKey = process.env.FIVESIM_API_KEY;

  if (!fiveSimKey) {
    return NextResponse.json({ error: "Missing FIVESIM_API_KEY" }, { status: 500 });
  }

  // 10 minutes ago
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("status", "waiting")
    .lt("created_at", tenMinutesAgo)
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!orders || orders.length === 0) {
    return NextResponse.json({ message: "No expired orders", checked: 0, refunded: 0 });
  }

  let refunded = 0;

  for (const order of orders) {
    try {
      const providerId = order.order_id_5sim || order.fivesim_id || order.order_id || order.provider_id;
      const refundAmount = order.price || order.sold_price || order.cost_price || 0;
      const userId = order.user_id;

      if (!providerId || !userId) continue;

      // 1. Cancel on 5sim
      try {
        await fetch(`https://5sim.net/v1/user/cancel/${providerId}`, {
          headers: { Authorization: `Bearer ${fiveSimKey}` },
        });
      } catch {}

      // 2. Refund wallet
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (wallet) {
        await supabase
          .from("wallets")
          .update({ balance: Number(wallet.balance) + Number(refundAmount), updated_at: new Date().toISOString() })
          .eq("user_id", userId);
      }

      // 3. Update order
      await supabase
        .from("orders")
        .update({ status: "canceled" })
        .eq("id", order.id);

      // 4. Transaction log (ignore if no table)
      try {
        await supabase.from("transactions").insert({
          user_id: userId,
          amount: refundAmount,
          type: "refund",
          description: `Auto-refund expired order ${providerId}`,
        });
      } catch {}

      refunded++;
    } catch (e) {
      console.error("Refund failed for", order.id, e);
    }
  }

  return NextResponse.json({ checked: orders.length, refunded });
}
