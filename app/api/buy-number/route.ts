import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { service, country, price, cost, phoneNumber, fiveSimId } = body
    
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

    // Make sure fiveSimId is a real number, not "undefined"
    const cleanId = fiveSimId ? parseInt(String(fiveSimId)) : null
    const numPrice = parseInt(String(price)) || 0
    const numCost = parseInt(String(cost)) || 0

    const { data, error } = await supabase.from('orders').insert({
      user_email: user.email,
      service: service || 'unknown',
      country: country || 'nigeria',
      number: phoneNumber || '+234000000000',
      price: numPrice,
      cost: numCost,
      profit: numPrice - numCost,
      status: 'active',
      fivesim_id: fiveSimId ? String(fiveSimId) : null,
      order_id: cleanId, // now number, not string
      order_id_5sim: cleanId // now number, not string
    }).select().single()

    if (error) {
      console.error("INSERT ERROR:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Deduct wallet - direct update (rpc sometimes fails)
    const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single()
    if (profile) {
      await supabase.from('profiles').update({ 
        balance: profile.balance - numPrice 
      }).eq('id', user.id)
    }

    return NextResponse.json({ success: true, order: data })
  } catch (e: any) {
    console.error("CATCH ERROR:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
