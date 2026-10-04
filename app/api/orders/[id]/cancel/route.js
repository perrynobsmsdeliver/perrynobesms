import { createClient } from '@supabase/supabase-js'

export async function POST(req, { params }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  const { id } = params
  const { data: order } = await supabase.from('orders').select('*').eq('id', id).single()
  if (!order) return Response.json({ error: 'Not found' }, { status: 404 })
  if (order.status === 'cancelled') return Response.json({ error: 'Already cancelled' })

  // Get refund amount - check all possible field names
  const refundAmount = Number(order.price || order.amount || order.total_amount || 0)

  // Get wallet
  const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', order.user_id).maybeSingle()
  const newBalance = Number(wallet?.balance || 0) + refundAmount

  // Update wallet
  if (wallet) {
    await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', order.user_id)
  } else {
    await supabase.from('wallets').insert({ user_id: order.user_id, balance: newBalance })
  }

  // Cancel order
  await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id)

  // Log transaction
  await supabase.from('transactions').insert({
    user_id: order.user_id,
    type: 'refund',
    amount: refundAmount,
    status: 'success',
    description: `Refund for order ${id}`
  })

  return Response.json({ success: true, newBalance, refunded: refundAmount })
}
