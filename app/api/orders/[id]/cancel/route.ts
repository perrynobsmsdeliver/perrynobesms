import { createClient } from '@supabase/supabase-js'

export async function POST(req, { params }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  const { id } = params
  const { data: order } = await supabase.from('orders').select('*').eq('id', id).single()
  
  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 })
  if (order.status === 'cancelled') return Response.json({ message: 'Already cancelled' })

  // 1. Cancel on 5sim
  try {
    await fetch(`https://5sim.net/v1/user/cancel/${order.number_id}`, {
      headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}` }
    })
  } catch (e) { console.log('5sim cancel error', e) }

  // 2. REFUND (ADD money back, not remove)
  const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', order.user_id).single()
  
  await supabase.from('wallets').update({ 
    balance: (wallet.balance + order.price) 
  }).eq('user_id', order.user_id)

  await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id)

  return Response.json({ success: true, refunded: order.price, newBalance: wallet.balance + order.price })
}
