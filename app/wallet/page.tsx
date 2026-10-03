"use client"
import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function WalletPage() {
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("wallets").select("balance").eq("user_id", user.id).single();
      if (data) setBalance(data.balance);
    };
    getBalance();
  }, []);

  const handlePay = async () => {
    const amt = Number(amount);
    if (amt < 100) return alert("Minimum na ₦100 boss");
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("Login first"); setLoading(false); return; }

    const res = await fetch("/api/paystack/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        amount: amt * 100,
        user_id: user.id
      })
    });
    const data = await res.json();
    setLoading(false);
    if (data.authorization_url) {
      window.location.href = data.authorization_url;
    } else {
      alert(data.error || "Error");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-2xl font-bold">Wallet</h1>
      <div className="bg-zinc-900 p-4 rounded-xl mt-4">
        <p className="text-gray-400">Current Balance</p>
        <p className="text-3xl font-bold">₦{balance.toLocaleString()}</p>
      </div>
      <div className="bg-zinc-900 p-4 rounded-xl mt-6">
        <h2 className="font-bold">Fund Wallet</h2>
        <input
          type="number"
          placeholder="Enter amount e.g 500"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border border-zinc-700 bg-black p-3 w-full rounded mt-3 text-white"
          min={100}
        />
        <div className="flex gap-2 mt-3">
          <button onClick={() => setAmount("500")} className="border border-zinc-700 p-2 rounded flex-1">₦500</button>
          <button onClick={() => setAmount("1000")} className="border border-zinc-700 p-2 rounded flex-1">₦1k</button>
          <button onClick={() => setAmount("5000")} className="border border-zinc-700 p-2 rounded flex-1">₦5k</button>
        </div>
        <button
          onClick={handlePay}
          disabled={loading || !amount}
          className="bg-green-600 text-white w-full p-3 rounded mt-4 font-bold disabled:opacity-50"
        >
          {loading ? "Processing..." : `Pay ₦${amount || 0}`}
        </button>
        <p className="text-sm text-gray-500 mt-2 text-center">Minimum: ₦100 • Paystack secured</p>
      </div>
    </div>
  );
}
