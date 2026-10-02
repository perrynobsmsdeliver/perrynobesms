"use client";
import { useState, useEffect } from "react";

const CUSTOMER_PRICE_NAIRA: Record<string, number> = {
  whatsapp: 1808, telegram: 1648, facebook: 1024, tiktok: 1920, google: 512,
  instagram: 976, signal: 800, line: 1280, airbnb: 960, steam: 1600,
  uber: 2400, netflix: 3200, linkedin: 4000, tinder: 3200, snapchat: 1600,
  binance: 8000, paypal: 8000, apple: 4800, microsoft: 480, twitter: 2400,
  amazon: 2720, discord: 3200, openai: 608,
};

const APPS = [
  { id: "whatsapp", name: "WhatsApp", icon: "💬" }, { id: "telegram", name: "Telegram", icon: "✈️" },
  { id: "facebook", name: "Facebook", icon: "👥" }, { id: "tiktok", name: "TikTok", icon: "🎵" },
  { id: "google", name: "Google", icon: "🔍" }, { id: "instagram", name: "Instagram", icon: "📸" },
  { id: "signal", name: "Signal", icon: "🔒" }, { id: "line", name: "Line", icon: "💚" },
  { id: "airbnb", name: "Airbnb", icon: "🏠" }, { id: "steam", name: "Steam", icon: "🎮" },
  { id: "uber", name: "Uber", icon: "🚗" }, { id: "netflix", name: "Netflix", icon: "🎬" },
  { id: "linkedin", name: "LinkedIn", icon: "💼" }, { id: "tinder", name: "Tinder", icon: "🔥" },
  { id: "snapchat", name: "Snapchat", icon: "👻" }, { id: "binance", name: "Binance", icon: "🪙" },
  { id: "paypal", name: "PayPal", icon: "💳" }, { id: "apple", name: "Apple ID", icon: "🍎" },
  { id: "microsoft", name: "Microsoft", icon: "🪟" }, { id: "twitter", name: "Twitter", icon: "🐦" },
  { id: "amazon", name: "Amazon", icon: "📦" }, { id: "discord", name: "Discord", icon: "🎧" },
  { id: "openai", name: "ChatGPT", icon: "🤖" },
];

export default function Home() {
  const [wallet, setWallet] = useState(0);
  const [showWallet, setShowWallet] = useState(false);
  const [selected, setSelected] = useState("whatsapp");
  const price = CUSTOMER_PRICE_NAIRA[selected];

  useEffect(() => { const w = localStorage.getItem("perrynobe_wallet"); if (w) setWallet(Number(w)); }, []);
  useEffect(() => { localStorage.setItem("perrynobe_wallet", String(wallet)); }, [wallet]);

  const handleBuy = () => {
    if (wallet < price) { setShowWallet(true); return; }
    setWallet(wallet - price);
    alert(`Success! ${APPS.find(a=>a.id===selected)?.name} number purchased for ₦${price}. Check your SMS inbox.`);
  }

  return (
    <div className="min-h-screen bg-[#08080f] text-white">
      <script src="https://js.paystack.co/v1/inline.js"></script>

      {/* NAV */}
      <nav className="sticky top-0 z-30 flex justify-between items-center px-6 md:px-12 py-4 border-b border-white/10 backdrop-blur-xl bg-black/30">
        <div className="flex items-center gap-2 font-black text-xl"><div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">P</div> PerryNobe</div>
        <div onClick={() => setShowWallet(true)} className="cursor-pointer px-4 py-2 rounded-full bg-white/10 border border-white/20 flex items-center gap-2">
          <span>👛</span><b className="text-green-400">₦{wallet.toLocaleString()}</b>
        </div>
      </nav>

      <div className="max-w-[1100px] mx-auto px-6 py-8 grid lg:grid-cols-3 gap-8">
        {/* LEFT - SERVICES */}
        <div className="lg:col-span-2">
          <h1 className="text-4xl font-extrabold">Buy Virtual Numbers <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Instantly</span></h1>
          <p className="text-white/60 mt-2 text-sm">On-demand OTP for 200+ countries • Instant delivery • Pay-as-you-go</p>

          <h3 className="mt-8 mb-3 font-bold text-white/80">Choose Service - Instant OTP</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {APPS.map(app => {
              const p = CUSTOMER_PRICE_NAIRA[app.id];
              const active = selected === app.id;
              return (
                <div key={app.id} onClick={() => setSelected(app.id)} className={`cursor-pointer rounded-2xl p-4 border text-center transition-all ${active? "bg-gradient-to-br from-violet-600 to-indigo-600 border-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.4)] scale-[1.02]" : "bg-white/[0.05] border-white/10 hover:bg-white/[0.08]"}`}>
                  <div className="text-xl">{app.icon}</div>
                  <div className="font-bold text-[13px] mt-1">{app.name}</div>
                  <div className={`mt-2 text-lg font-black ${active?"text-white":"text-green-400"}`}>₦{p.toLocaleString()}</div>
                  <div className="text-[10px] opacity-60">per OTP</div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-5 rounded-2xl bg-white/[0.04] border border-white/10">
            <h4 className="font-bold">How to Use</h4>
            <div className="text-[13px] leading-6 mt-2 text-white/60">
              <b className="text-white">1.</b> Fund your wallet 👛 using Paystack<br/>
              <b className="text-white">2.</b> Select App - Price you see is final you pay<br/>
              <b className="text-white">3.</b> Click Buy Now - Number appears instantly<br/>
              <b className="text-white">4.</b> Use number to receive OTP<br/>
            </div>
          </div>
        </div>

        {/* RIGHT - BUY CARD */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-[24px] p-[1px] bg-gradient-to-b from-violet-500/50 to-transparent">
            <div className="rounded-[24px] bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1e] p-6">
              <div className="text-xs opacity-60">{APPS.find(a => a.id === selected)?.name.toUpperCase()} NUMBER</div>
              <div className="text-5xl font-black mt-2">₦{price.toLocaleString()}</div>
              <div className="mt-3 inline-flex px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">⚡ Delivered in &lt;10s • Instant</div>

              <button onClick={handleBuy} className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 font-black text-[15px] shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:scale-[1.02] transition">
                Buy Now - Wallet 👛
              </button>

              <div className="mt-4 text-[11px] text-white/40 text-center">Secure • 99.9% Uptime • 24/7 Support</div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="text-xs font-bold mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Live Numbers Available</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded-lg bg-white/5"><span>🇺🇸 United States +1</span><span className="text-green-300">+1,240</span></div>
                  <div className="flex justify-between p-2 rounded-lg bg-white/5"><span>🇳🇬 Nigeria +234</span><span className="text-green-300">+1,102</span></div>
                  <div className="flex justify-between p-2 rounded-lg bg-white/5"><span>🇬🇧 UK +44</span><span className="text-green-300">+860</span></div>
                </div>
              </div>
            </div>
          </div>

          <footer className="mt-6 p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center text-[11px] text-white/40">
            <div className="font-bold text-white/70">📞 08084752266 | 💬 WhatsApp 24/7</div>
            <div className="mt-2">© 2026 PerryNobe SMS</div>
          </footer>
        </div>
      </div>

      {/* FLOATING */}
      <div className="fixed bottom-5 right-4 z-40 flex flex-col gap-3">
        <a href="https://wa.me/2348084752266?text=Hello%20PerryNobe%2C%20I%20need%20help" target="_blank" className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center text-2xl shadow-lg">💬</a>
        <a href="tel:+2348084752266" className="w-14 h-14 rounded-full bg-black border border-white/20 flex items-center justify-center text-xl shadow-lg">📞</a>
      </div>

      {/* WALLET MODAL */}
      {showWallet && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#15151f] border border-white/10 max-w-[380px] w-full rounded-[20px] p-6">
            <h3 className="font-bold text-lg">Fund Wallet 👛</h3>
            <div className="bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 rounded-2xl p-5 mt-4 text-center"><div className="text-xs opacity-60">Balance</div><div className="text-3xl font-black text-green-400">₦{wallet.toLocaleString()}</div></div>
            <button onClick={() => { setWallet(wallet + 2000); setShowWallet(false); }} className="w-full mt-4 py-4 rounded-xl bg-green-500 font-black text-black">Add ₦2,000 (Demo - Paystack Live Next)</button>
            <div className="mt-3 text-[11px] opacity-50 text-center">Need help? Chat: 08084752266</div>
            <button onClick={() => setShowWallet(false)} className="w-full mt-3 py-3 rounded-xl bg-white/10 border border-white/10">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
