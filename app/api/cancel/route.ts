// @ts-nocheck
export const dynamic = 'force-dynamic';

import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { order_id } = await req.json()
  
  if(!order_id) return Response.json({ error: "No order_id" }, { status: 400 });

  const { data: order } = await supabase.from('orders').select('*').eq('id', order_id).single()
  if(!order) return Response.json({ error: "Order not found" }, { status: 404 });
  
  // RETURN money - plus
  const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', order.user_id).maybeSingle()
  const current = wallet?.balance || 0;
  const newBalance = Number(current) + Number(order.price || order.amount || 0);
  
  await supabase.from('wallets').upsert({ 
    user_id: order.user_id, 
    balance: newBalance,
    updated_at: new Date().toISOString()
  }, { onConflict: "user_id" });

  await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order_id)
  
  return Response.json({ success: true, new_balance: newBalance })
}
