"use client";
import { useState, useEffect } from "react";

// FINAL CUSTOMER PRICE = Already X10 in Naira
const CUSTOMER_PRICE_NAIRA: Record<string, number> = {
  whatsapp: 1808, telegram: 1648, facebook: 1024, tiktok: 1920, google: 512,
  instagram: 976, signal: 800, line: 1280, airbnb: 960, steam: 1600,
  uber: 2400, netflix: 3200, linkedin: 4000, tinder: 3200, snapchat: 1600,
  binance: 8000, paypal: 8000, apple: 4800, microsoft: 480, twitter: 2400,
  amazon: 2720, discord: 3200, openai: 608,
};

const APPS = [
  { id: "whatsapp", name: "WhatsApp" }, { id: "telegram", name: "Telegram" },
  { id: "facebook", name: "Facebook" }, { id: "tiktok", name: "TikTok" },
  { id: "google", name: "Google" }, { id: "instagram", name: "Instagram" },
  { id: "signal", name: "Signal" }, { id: "line", name: "Line" },
  { id: "airbnb", name: "Airbnb" }, { id: "steam", name: "Steam" },
  { id: "uber", name: "Uber" }, { id: "netflix", name: "Netflix" },
  { id: "linkedin", name: "LinkedIn" }, { id: "tinder", name: "Tinder" },
  { id: "snapchat", name: "Snapchat" }, { id: "binance", name: "Binance" },
  { id: "paypal", name: "PayPal" }, { id: "apple", name: "Apple ID" },
  { id: "microsoft", name: "Microsoft" }, { id: "twitter", name: "Twitter" },
  { id: "amazon", name: "Amazon" }, { id: "discord", name: "Discord" },
  { id: "openai", name: "ChatGPT" },
];

export default function Home() {
  const [wallet, setWallet] = useState(0);
  const [showWallet, setShowWallet] = useState(false);
  const [selected, setSelected] = useState("whatsapp");
  const price = CUSTOMER_PRICE_NAIRA[selected];

  useEffect(() => { const w = localStorage.getItem("perrynobe_wallet"); if (w) setWallet(Number(w)); }, []);
  useEffect(() => { localStorage.setItem("perrynobe_wallet", String(wallet)); }, [wallet]);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
      <script src="https://js.paystack.co/v1/inline.js"></script>
      <header style={{ background: "black", color: "white", padding: "14px 20px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <b>PerryNobe SMS</b>
          <div onClick={() => setShowWallet(true)} style={{ background: "#111", border: "1px solid #333", padding: "8px 14px", borderRadius: 30, cursor: "pointer" }}>👛 <b style={{ color: "#22c55e" }}>₦{wallet.toLocaleString()}</b></div>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
        <h3 style={{ margin: "0 0 10px 0" }}>Choose Service - Instant OTP</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))", gap: 10 }}>
          {APPS.map(app => {
            const p = CUSTOMER_PRICE_NAIRA[app.id];
            const active = selected === app.id;
            return (
              <div key={app.id} onClick={() => setSelected(app.id)} style={{ border: active? "2px solid black" : "1px solid #e5e7eb", borderRadius: 14, padding: 14, cursor: "pointer", background: active? "black" : "white", color: active? "white" : "black", textAlign: "center" }}>
                <div style={{ fontWeight: 700 }}>{app.name}</div>
                <div style={{ marginTop: 8, fontSize: 18, fontWeight: 900, color: active? "#22c55e" : "#059669" }}>₦{p.toLocaleString()}</div>
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>per OTP</div>
              </div>
            );
          })}
        </div>

        <div style={{ background: "white", borderRadius: 16, padding: 16, marginTop: 14, border: "1px solid #e5e7eb" }}>
          <h4 style={{ margin: "0 0 10px 0" }}>How to Use</h4>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            <b>1.</b> Fund your wallet 👛 using Paystack<br/>
            <b>2.</b> Select App - Price you see is final you pay<br/>
            <b>3.</b> Click Buy Now - Number appears instantly<br/>
            <b>4.</b> Use number to receive OTP<br/>
          </div>
        </div>

        <div style={{ background: "black", color: "white", borderRadius: 16, padding: 18, marginTop: 14, textAlign: "center" }}>
          <div style={{ opacity: 0.6, fontSize: 11 }}>{APPS.find(a => a.id === selected)?.name.toUpperCase()} NUMBER</div>
          <div style={{ fontSize: 36, fontWeight: 900, marginTop: 4 }}>₦{price.toLocaleString()}</div>
          <button onClick={() => wallet < price? setShowWallet(true) : setWallet(wallet - price)} style={{ width: "100%", marginTop: 14, background: "white", color: "black", border: 0, padding: 16, borderRadius: 12, fontWeight: 900, cursor: "pointer" }}>Buy Now - Wallet 👛</button>
        </div>

        <footer style={{ marginTop: 30, background: "white", borderTop: "1px solid #e5e7eb", padding: 20, textAlign: "center", fontSize: 12, borderRadius: 14 }}>
          <div style={{ fontWeight: 700 }}>📞 08084752266 | 💬 WhatsApp 24/7 - Customer Support</div>
          <div style={{ marginTop: 6, opacity: 0.6 }}>Tap green button to chat us on WhatsApp</div>
          <div style={{ marginTop: 6, opacity: 0.5 }}>© 2026 PerryNobe SMS</div>
        </footer>
      </div>

      {/* FLOATING CUSTOMER SERVICE BUTTONS - YOUR NUMBER */}
      <div style={{ position: "fixed", bottom: 20, right: 16, zIndex: 40, display: "flex", flexDirection: "column", gap: 10 }}>
        <a href="https://wa.me/2348084752266?text=Hello%20PerryNobe%2C%20I%20need%20help%20with%20OTP" target="_blank" style={{ background: "#25D366", color: "white", width: 56, height: 56, borderRadius: 50, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, textDecoration: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>💬</a>
        <a href="tel:+2348084752266" style={{ background: "black", color: "white", width: 56, height: 56, borderRadius: 50, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, textDecoration: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>📞</a>
      </div>

      {showWallet && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "white", maxWidth: 380, width: "100%", borderRadius: 20, padding: 20 }}>
            <h3 style={{ margin: 0 }}>Fund Wallet 👛</h3>
            <div style={{ background: "black", color: "white", borderRadius: 14, padding: 16, marginTop: 12, textAlign: "center" }}><div>Balance</div><div style={{ fontSize: 28, fontWeight: 900, color: "#22c55e" }}>₦{wallet.toLocaleString()}</div></div>
            <button onClick={() => { setWallet(wallet + 2000); setShowWallet(false); }} style={{ width: "100%", marginTop: 12, padding: 14, borderRadius: 12, background: "#22c55e", color: "white", border: 0, fontWeight: 900 }}>Add ₦2,000 (Demo - Paystack Live Next)</button>
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.6, textAlign: "center" }}>Need help? Chat: 08084752266</div>
            <button onClick={() => setShowWallet(false)} style={{ width: "100%", marginTop: 8, padding: 10, background: "white", border: "1px solid #ddd", borderRadius: 10, cursor: "pointer" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
