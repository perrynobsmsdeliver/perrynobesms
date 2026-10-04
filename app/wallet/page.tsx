"use client"
import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url ||!key) return null
  return createClient(url, key)
}

declare global {
  interface Window {
    PaystackPop: any
  }
}

export default function WalletPage() {
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const supabase = getSupabase();

  useEffect(() => {
    // Load Paystack script
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    document.body.appendChild(script)

    if (!supabase) return;
    const getBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("wallets").select("balance").eq("user_id", user.id).single();
      if (data) setBalance(data.balance);
    };
    getBalance();
  }, [supabase]);

  const fundWallet = async () => {
    if (!amount || Number(amount) < 100) {
      alert("Minimum is ₦100")
      return
    }
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Login first")
      return
    }

    setLoading(true)

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!, // Add this in Vercel!
      email: user.email,
      amount: Number(amount) * 100, // kobo
      currency: "NGN",
      callback: async function (response: any) {
        // Verify and update wallet immediately
        const res = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: response.reference,
            amount: Number(amount),
            user_id: user.id,
            email: user.email
          })
        })
        const result = await res.json()
        setLoading(false)
        if (result.success) {
          setBalance(prev => prev + Number(amount))
          alert(`Success! ₦${amount} added. New balance: ₦${balance + Number(amount)}`)
          setAmount("")
          window.location.reload() // Show immediately
        } else {
          alert("Verification failed, contact support with ref: " + response.reference)
        }
      },
      onClose: function () {
        setLoading(false)
        alert("Payment closed")
      }
    })
    handler.openIframe()
  }

  if (!supabase) return <div style={{padding:20}}>⚠️ Supabase env missing - add NEXT_PUBLIC_SUPABASE_URL & ANON_KEY in Vercel</div>

  return (
    <div style={{ padding: 20, maxWidth: 400 }}>
      <h1 style={{fontSize:24, fontWeight:'bold'}}>Wallet: ₦{balance}</h1>

      <div style={{marginTop:20}}>
        <input
          type="number"
          placeholder="Amount e.g 500"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{border:'1px solid #ccc', padding:10, width:'100%', borderRadius:8}}
        />
        <button
          onClick={fundWallet}
          disabled={loading}
          style={{marginTop:10, background:'black', color:'white', padding:12, width:'100%', borderRadius:8}}
        >
          {loading? "Processing..." : `Fund ₦${amount || 0}`}
        </button>
      </div>
    </div>
  )
}
