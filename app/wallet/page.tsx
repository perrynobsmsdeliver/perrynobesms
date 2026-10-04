"use client"
import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export default function WalletPage() {
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const supabase = getSupabase();

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    document.body.appendChild(script)

    const getBalance = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle();
      if (data) setBalance(data.balance);
    };
    getBalance();
  }, []);

  const fundWallet = async () => {
    if (!amount || Number(amount) < 100) return alert("Minimum is ₦100")
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Login first")
    setLoading(true)

    // @ts-ignore - Paystack is loaded from script
    const handler = (window as any).PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: user.email,
      amount: Number(amount) * 100,
      currency: "NGN",
      callback: async function (response: any) {
        const res = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: response.reference, amount: Number(amount), user_id: user.id, email: user.email })
        })
        const result = await res.json()
        setLoading(false)
        if (result.success) {
          setBalance(result.new_balance)
          alert(`Success! ₦${amount} added.`)
          setAmount("")
        } else {
          alert("Failed: " + result.error)
        }
      },
      onClose: function () {
        setLoading(false)
      }
    })
    handler.openIframe()
  }

  if (!supabase) return <div style={{padding:20}}>⚠️ Add env vars in Vercel</div>

  return (
    <div style={{ padding: 20, maxWidth: 400 }}>
      <h1 style={{fontSize:24, fontWeight:'bold'}}>Wallet: ₦{balance}</h1>
      <input type="number" placeholder="Amount e.g 500" value={amount} onChange={(e) => setAmount(e.target.value)} style={{border:'1px solid #ccc', padding:10, width:'100%', borderRadius:8, marginTop:20}} />
      <button onClick={fundWallet} disabled={loading} style={{marginTop:10, background:'black', color:'white', padding:12, width:'100%', borderRadius:8}}>
        {loading? "Processing..." : `Fund ₦${amount || 0}`}
      </button>
    </div>
  )
}
