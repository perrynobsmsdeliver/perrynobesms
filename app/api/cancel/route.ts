import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  const { order_id } = await req.json()
  
  const { data: order } = await supabase.from('orders').select('*').eq('id', order_id).single()
  
  // RETURN money - plus
  const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', order.user_id).single()
  const newBalance = Number(wallet.balance) + Number(order.price)
  
  await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', order.user_id)
  await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order_id)
  
  return Response.json({ success: true, new_balance: newBalance })
}
