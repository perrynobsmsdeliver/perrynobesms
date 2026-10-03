"use client"
import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url ||!key) return null
  return createClient(url, key)
}

export default function WalletPage() {
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const supabase = getSupabase();

  useEffect(() => {
    if (!supabase) return;
    const getBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("wallets").select("balance").eq("user_id", user.id).single();
      if (data) setBalance(data.balance);
    };
    getBalance();
  }, [supabase]);

  if (!supabase) return <div style={{padding:20}}>⚠️ Supabase env missing - add NEXT_PUBLIC_SUPABASE_URL & ANON_KEY in Vercel</div>

  return (
    <div style={{ padding: 20 }}>
      <h1>Wallet: ₦{balance}</h1>
    </div>
  )
}
