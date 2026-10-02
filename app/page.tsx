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

  return (
    <div style={{ minHeight: "100vh", background: "#08080f", color: "white", fontFamily: "Inter, sans-serif" }}>
      <script src="https://js.paystack.co/v1/inline.js"></script>

      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, fontSize: 20 }}><div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>P</div> PerryNobe</div>
        <div onClick={() => setShowWallet(true)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", padding: "8px 16px", borderRadius: 100, cursor: "pointer" }}>👛 <b style={{ color: "#22c55e" }}>₦{wallet.toLocaleString()}</b></div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
        <h1 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.1, margin: 0 }}>Buy Virtual Numbers<br/><span style={{ background: "linear-gradient(90deg,#a78bfa,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Instantly</span></h1>
        <p style={{ opacity: 0.6, marginTop: 12, fontSize: 14 }}>On-demand OTP for 200+ countries • Instant delivery • Pay-as-you-go</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginTop: 24 }}>
          <div>
            <h3 style={{ margin: "0 0 12px 0", opacity: 0.8 }}>Choose Service - Instant OTP</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 }}>
              {APPS.map(app => {
                const active = selected === app.id;
                return (
                  <div key={app.id} onClick={() => setSelected(app.id)} style={{ background: active? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.06)", border: active? "1px solid #8b5cf6" : "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 14, textAlign: "center", cursor: "pointer", transform: active? "scale(1.03)" : "scale(1)", boxShadow: active? "0 0 20px rgba(124,58,237,0.4)" : "none" }}>
                    <div style={{ fontSize: 20 }}>{app.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 12, marginTop: 4 }}>{app.name}</div>
                    <div style={{ marginTop: 8, fontSize: 16, fontWeight: 900, color: active? "white" : "#22c55e" }}>₦{CUSTOMER_PRICE_NAIRA[app.id].toLocaleString()}</div>
                    <div style={{ fontSize: 9, opacity: 0.5 }}>per OTP</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ height: "fit-content" }}>
            <div style={{ background: "linear-gradient(180deg,#1a1a2e,#0f0f1e)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 24, padding: 20, boxShadow: "0 0 40px rgba(124,58,237,0.2)" }}>
              <div style={{ fontSize: 10, opacity: 0.5, letterSpacing: 1 }}>{APPS.find(a=>a.id===selected)?.name.toUpperCase()} NUMBER</div>
              <div style={{ fontSize: 44, fontWeight: 900, marginTop: 6 }}>₦{price.toLocaleString()}</div>
              <div style={{ marginTop: 10, display: "inline-block", padding: "6px 12px", borderRadius: 100, background: "rgba(34,197,94,0.15)", color: "#22c55e", fontSize: 11 }}>⚡ Delivered in &lt;10s • Instant</div>
              <button onClick={()=> wallet<price? setShowWallet(true) : setWallet(wallet-price)} style={{ width: "100%", marginTop: 18, padding: 16, borderRadius: 14, background: "linear-gradient(90deg,#7c3aed,#4f46e5)", color: "white", border: 0, fontWeight: 900, cursor: "pointer", fontSize: 15 }}>Buy Now - Wallet 👛</button>
              <div style={{ marginTop: 16, fontSize: 10, opacity: 0.3, textAlign: "center" }}>Secure • 99.9% Uptime • 24/7 Support</div>
              <div style={{ marginTop: 18, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>🟢 Live Numbers Available</div>
                <div style={{ fontSize: 11, background: "rgba(255,255,255,0.05)", padding: 8, borderRadius: 8, display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span>🇺🇸 US +1</span><span style={{ color: "#22c55e" }}>+1,240</span></div>
                <div style={{ fontSize: 11, background: "rgba(255,255,255,0.05)", padding: 8, borderRadius: 8, display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span>🇳🇬 NG +234</span><span style={{ color: "#22c55e" }}>+1,102</span></div>
                <div style={{ fontSize: 11, background: "rgba(255,255,255,0.05)", padding: 8, borderRadius: 8, display: "flex", justifyContent: "space-between" }}><span>🇬🇧 UK +44</span><span style={{ color: "#22c55e" }}>+860</span></div>
              </div>
            </div>
          </div>
        </div>

        <footer style={{ marginTop: 40, textAlign: "center", fontSize: 11, opacity: 0.4, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20 }}>© 2026 PerryNobe SMS • 📞 08084752266 • 💬 WhatsApp 24/7</footer>
      </div>

      <div style={{ position: "fixed", bottom: 20, right: 16, display: "flex", flexDirection: "column", gap: 10, zIndex: 40 }}>
        <a href="https://wa.me/2348084752266" target="_blank" style={{ width: 56, height: 56, borderRadius: 50, background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, textDecoration: "none" }}>💬</a>
        <a href="tel:+2348084752266" style={{ width: 56, height: 56, borderRadius: 50, background: "black", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, textDecoration: "none" }}>📞</a>
      </div>

      {showWallet && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#15151f", border: "1px solid rgba(255,255,255,0.1)", maxWidth: 360, width: "100%", borderRadius: 20, padding: 20 }}>
            <h3 style={{ margin: 0 }}>Fund Wallet 👛</h3>
            <div style={{ background: "black", borderRadius: 14, padding: 16, marginTop: 12, textAlign: "center" }}><div style={{ fontSize: 11, opacity: 0.5 }}>Balance</div><div style={{ fontSize: 28, fontWeight: 900, color: "#22c55e" }}>₦{wallet.toLocaleString()}</div></div>
            <button onClick={() => { setWallet(wallet + 2000); setShowWallet(false); }} style={{ width: "100%", marginTop: 12, padding: 14, borderRadius: 12, background: "#22c55e", color: "black", border: 0, fontWeight: 900 }}>Add ₦2,000 (Demo)</button>
            <button onClick={() => setShowWallet(false)} style={{ width: "100%", marginTop: 8, padding: 10, background: "rgba(255,255,255,0.1)", border: "1px solid #333", borderRadius: 10, color: "white" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
