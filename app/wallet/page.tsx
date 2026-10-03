"use client"
import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

export default function WalletPage() {
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  // Create supabase INSIDE component, not outside
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  useEffect(() => {
    const getBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("wallets").select("balance").eq("user_id", user.id).single();
      if (data) setBalance(data.balance);
    };
    getBalance();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Wallet: ₦{balance}</h1>
      {/* keep your other UI here */}
    </div>
  )
}
