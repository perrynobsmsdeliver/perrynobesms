import { createClient } from '@supabase/supabase-js'

export async function POST(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { id } = await req.json()  // <-- difference here
  const { data: order } = await supabase.from('orders').select('*').eq('id', id).single()
  if (!order) return Response.json({ error: 'Not found' })

  const refundAmount = Number(order.price || order.amount || 0)
  const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', order.user_id).maybeSingle()
  const newBalance = Number(wallet?.balance || 0) + refundAmount

  if (wallet) {
    await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', order.user_id)
  } else {
    await supabase.from('wallets').insert({ user_id: order.user_id, balance: newBalance })
  }

  await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id)
  
  await supabase.from('transactions').insert({
    user_id: order.user_id,
    type: 'refund',
    amount: refundAmount,
    status: 'success',
    description: `Refund for order ${id}`
  })

  return Response.json({ success: true, newBalance })
}
