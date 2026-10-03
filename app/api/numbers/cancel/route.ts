import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  const { orderId, price, userId } = await req.json()

  // 1. Cancel for 5SIM
  const res = await fetch(`https://5sim.net/v1/user/cancel/${orderId}`, {
    headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}` }
  })

  if (!res.ok) {
    return Response.json({ success: false, message: "Cancel failed on 5SIM" })
  }

  // 2. Refund wallet - ADD money back
  const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', userId).single()
  
  const newBalance = Number(wallet.balance) + Number(price)

  await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', userId)

  return Response.json({ success: true, newBalance })
}
