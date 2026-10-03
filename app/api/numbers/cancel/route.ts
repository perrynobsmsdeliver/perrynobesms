import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { orderId, price, userId } = await req.json()

    // 1. Cancel for 5SIM
    const res = await fetch(`https://5sim.net/v1/user/cancel/${orderId}`, {
      headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}` }
    })

    if (!res.ok) {
      return NextResponse.json({ success: false, message: "Cancel failed on 5SIM" })
    }

    // 2. Refund wallet - ADD money back
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single()
    
    if (!wallet) {
      return NextResponse.json({ success: false, message: "Wallet not found" })
    }

    const newBalance = Number(wallet.balance) + Number(price)

    await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', userId)

    return NextResponse.json({ success: true, newBalance })

  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}
