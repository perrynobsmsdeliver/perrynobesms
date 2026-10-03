import { createClient } from '@supabase/supabase-js'

export async function POST(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { id } = await req.json()
  const { data: order } = await supabase.from('orders').select('*').eq('id', id).single()
  if (!order) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', order.user_id).single()
  
  const newBalance = Number(wallet.balance) + Number(order.price)

  await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', order.user_id)
  await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id)

  return Response.json({ success: true, newBalance })
}
