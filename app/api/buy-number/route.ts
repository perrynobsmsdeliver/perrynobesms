import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { service, country, price, cost, phoneNumber, fiveSimId } = await req.json()
    
    // Get user from auth header
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

    const { data, error } = await supabase.from('orders').insert({
      user_email: user.email,
      service: service,
      country: country,
      number: phoneNumber,
      price: parseInt(price),
      cost: parseInt(cost) || 0,
      profit: parseInt(price) - (parseInt(cost) || 0),
      status: 'active',
      fivesim_id: String(fiveSimId),
      order_id: String(fiveSimId),
      order_id_5sim: String(fiveSimId),
      sms_code: null
    }).select().single()

    if (error) {
      console.log(error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Deduct from wallet
    await supabase.rpc('deduct_wallet', { 
      p_user_id: user.id, 
      p_amount: parseInt(price) 
    })

    return NextResponse.json({ success: true, order: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
