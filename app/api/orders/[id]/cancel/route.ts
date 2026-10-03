import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await req.json()

  // 1. Get order
  const { data: order } = await supabaseAdmin.from('orders').select('*').eq('id', params.id).single()
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  
  // 2. Cancel on 5sim
  await fetch(`https://5sim.net/v1/user/ban/${order.provider_order_id}`, {
    headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}` }
  })

  // 3. REFUND USER - THIS WAS MISSING BEFORE
  const { data: wallet } = await supabaseAdmin.from('wallets').select('*').eq('user_id', order.user_id).single()
  if (wallet) {
    await supabaseAdmin.from('wallets').update({
      balance: wallet.balance + order.price
    }).eq('user_id', order.user_id)
  }

  // 4. Update order
  await supabaseAdmin.from('orders').update({ status: 'cancelled' }).eq('id', params.id)

  return NextResponse.json({ success: true, refunded: order.price })
}
