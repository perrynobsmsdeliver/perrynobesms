import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // MUST be service_role
)

export async function POST(req) {
  const { reference, amount, user_id, email } = await req.json()

  // 1. Verify with Paystack
  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
  })
  const verifyData = await verifyRes.json()
  if (!verifyData.status || verifyData.data.status !== 'success') {
    return Response.json({ success: false, error: "Paystack verification failed" })
  }

  // 2. Prevent duplicate credit
  const { data: exists } = await supabaseAdmin.from("transactions").select("id").eq("reference", reference).maybeSingle()
  if (exists) {
    const { data: wallet } = await supabaseAdmin.from("wallets").select("balance").eq("user_id", user_id).single()
    return Response.json({ success: true, new_balance: wallet?.balance || amount })
  }

  // 3. Insert transaction
  await supabaseAdmin.from("transactions").insert({ user_email: email, reference, amount, type: 'deposit', status: 'success' })

  // 4. ADD to balance, NOT overwrite
  const { data: currentWallet } = await supabaseAdmin.from("wallets").select("balance").eq("user_id", user_id).maybeSingle()
  let newBalance = amount
  if (currentWallet) {
    newBalance = currentWallet.balance + amount
    await supabaseAdmin.from("wallets").update({ balance: newBalance }).eq("user_id", user_id)
  } else {
    await supabaseAdmin.from("wallets").insert({ user_id, balance: amount })
  }

  return Response.json({ success: true, new_balance: newBalance })
}
