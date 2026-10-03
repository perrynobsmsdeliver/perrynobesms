import { createClient } from '@supabase/supabase-js'

export async function POST(req, { params }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  const { id } = params
  const { data: order } = await supabase.from('orders').select('*').eq('id', id).single()
  
  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 })
  if (order.status === 'cancelled') return Response.json({ message: 'Already cancelled' })

  try {
    await fetch(`https://5sim.net/v1/user/cancel/${order.number_id}`, {
      headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}` }
    })
  } catch (e) {}

  const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', order.user_id).single()
  
  const newBalance = Number(wallet.balance) + Number(order.price)

  await supabase.from('wallets').update({ 
    balance: newBalance 
  }).eq('user_id', order.user_id)

  await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id)

  return Response.json({ success: true, refunded: order.price, newBalance })
}
