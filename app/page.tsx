"use client";
import { useState, useEffect } from "react";

const CUSTOMER_PRICE_NAIRA: Record<string, number> = {
  whatsapp: 1808, telegram: 1648, facebook: 1024, tiktok: 1920, google: 512,
  instagram: 976, signal: 800, line: 1280, airbnb: 960, steam: 1600,
  uber: 2400, netflix: 3200, linkedin: 4000, tinder: 3200, snapchat: 1600,
  binance: 8000, paypal: 8000, apple: 4800, microsoft: 480, twitter: 2400,
  amazon: 2720, discord: 3200, openai: 608,
};

const COUNTRIES = [
  { c:"us", n:"USA", f:"🇺🇸", d:"+1" }, { c:"gb", n:"UK", f:"🇬🇧", d:"+44" },
  { c:"ca", n:"Canada", f:"🇨🇦", d:"+1" }, { c:"au", n:"Australia", f:"🇦🇺", d:"+61" },
  { c:"de", n:"Germany", f:"🇩🇪", d:"+49" }, { c:"fr", n:"France", f:"🇫🇷", d:"+33" },
  { c:"ng", n:"Nigeria", f:"🇳🇬", d:"+234" }, { c:"gh", n:"Ghana", f:"🇬🇭", d:"+233" },
  { c:"za", n:"South Africa", f:"🇿🇦", d:"+27" }, { c:"ke", n:"Kenya", f:"🇰🇪", d:"+254" },
  { c:"in", n:"India", f:"🇮🇳", d:"+91" }, { c:"id", n:"Indonesia", f:"🇮🇩", d:"+62" },
  { c:"ph", n:"Philippines", f:"🇵🇭", d:"+63" }, { c:"my", n:"Malaysia", f:"🇲🇾", d:"+60" },
  { c:"sg", n:"Singapore", f:"🇸🇬", d:"+65" }, { c:"ae", n:"UAE", f:"🇦🇪", d:"+971" },
  { c:"tr", n:"Turkey", f:"🇹🇷", d:"+90" }, { c:"ru", n:"Russia", f:"🇷🇺", d:"+7" },
  { c:"ua", n:"Ukraine", f:"🇺🇦", d:"+380" }, { c:"pl", n:"Poland", f:"🇵🇱", d:"+48" },
  { c:"es", n:"Spain", f:"🇪🇸", d:"+34" }, { c:"br", n:"Brazil", f:"🇧🇷", d:"+55" },
  { c:"mx", n:"Mexico", f:"🇲🇽", d:"+52" }, { c:"jp", n:"Japan", f:"🇯🇵", d:"+81" },
  { c:"sa", n:"Saudi Arabia", f:"🇸🇦", d:"+966" }, { c:"eg", n:"Egypt", f:"🇪🇬", d:"+20" },
  { c:"pk", n:"Pakistan", f:"🇵🇰", d:"+92" }, { c:"bd", n:"Bangladesh", f:"🇧🇩", d:"+880" },
  { c:"th", n:"Thailand", f:"🇹🇭", d:"+66" }, { c:"vn", n:"Vietnam", f:"🇻🇳", d:"+84" },
  { c:"it", n:"Italy", f:"🇮🇹", d:"+39" }, { c:"nl", n:"Netherlands", f:"🇳🇱", d:"+31" },
  { c:"se", n:"Sweden", f:"🇸🇪", d:"+46" }, { c:"ch", n:"Switzerland", f:"🇨🇭", d:"+41" },
];

const APPS = [
  { id:"whatsapp", name:"WhatsApp", icon:"💬" }, { id:"telegram", name:"Telegram", icon:"✈️" },
  { id:"facebook", name:"Facebook", icon:"👥" }, { id:"tiktok", name:"TikTok", icon:"🎵" },
  { id:"google", name:"Google", icon:"🔍" }, { id:"instagram", name:"Instagram", icon:"📸" },
  { id:"signal", name:"Signal", icon:"🔒" }, { id:"line", name:"Line", icon:"💚" },
  { id:"airbnb", name:"Airbnb", icon:"🏠" }, { id:"steam", name:"Steam", icon:"🎮" },
  { id:"uber", name:"Uber", icon:"🚗" }, { id:"netflix", name:"Netflix", icon:"🎬" },
  { id:"linkedin", name:"LinkedIn", icon:"💼" }, { id:"tinder", name:"Tinder", icon:"🔥" },
  { id:"snapchat", name:"Snapchat", icon:"👻" }, { id:"binance", name:"Binance", icon:"🪙" },
  { id:"paypal", name:"PayPal", icon:"💳" }, { id:"apple", name:"Apple ID", icon:"🍎" },
  { id:"microsoft", name:"Microsoft", icon:"🪟" }, { id:"twitter", name:"Twitter", icon:"🐦" },
  { id:"amazon", name:"Amazon", icon:"📦" }, { id:"discord", name:"Discord", icon:"🎧" },
  { id:"openai", name:"ChatGPT", icon:"🤖" },
];

export default function Home() {
  const [wallet, setWallet] = useState(0);
  const [showWallet, setShowWallet] = useState(false);
  const [selected, setSelected] = useState("whatsapp");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[6]);
  const [search, setSearch] = useState("");

  useEffect(()=>{ const w=localStorage.getItem("perrynobe_wallet"); if(w) setWallet(Number(w)); },[]);
  useEffect(()=>{ localStorage.setItem("perrynobe_wallet", String(wallet)); },[wallet]);

  const finalPrice = CUSTOMER_PRICE_NAIRA[selected];
  const filtered = COUNTRIES.filter(x=>x.n.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ minHeight:"100vh", background:"#08080f", color:"white", fontFamily:"sans-serif" }}>
      <script src="https://js.paystack.co/v1/inline.js"></script>
      <header style={{ display:"flex", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.1)", position:"sticky", top:0, background:"rgba(8,8,15,0.9)", backdropFilter:"blur(20px)", zIndex:10 }}>
        <b>🟣 PerryNobe • 190+ Countries</b>
        <div onClick={()=>setShowWallet(true)} style={{ background:"rgba(255,255,255,0.1)", padding:"8px 16px", borderRadius:100, cursor:"pointer" }}>👛 <b style={{ color:"#22c55e" }}>₦{wallet.toLocaleString()}</b></div>
      </header>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:16, display:"grid", gridTemplateColumns:"1fr 360px", gap:16 }}>
        <div>
          <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:12 }}>
            <b style={{ fontSize:13 }}>🌍 Country (190+ on 5sim API)</b>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search USA, Nigeria..." style={{ width:"100%", marginTop:10, padding:10, borderRadius:10, background:"#000", border:"1px solid #333", color:"white" }} />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))", gap:8, marginTop:10, maxHeight:220, overflowY:"auto" }}>
              {filtered.map(c=>(
                <div key={c.c} onClick={()=>setSelectedCountry(c)} style={{ padding:9, borderRadius:10, cursor:"pointer", background:selectedCountry.c===c.c?"linear-gradient(135deg,#7c3aed,#4f46e5)":"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", fontSize:12 }}>{c.f} {c.n}<div style={{ fontSize:10, opacity:0.6 }}>{c.d}</div></div>
              ))}
            </div>
          </div>

          <h3 style={{ margin:"14px 0 10px 0", fontSize:13, opacity:0.8 }}>Choose Service - Fixed Price All Countries</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:10 }}>
            {APPS.map(app=>{
              const active=selected===app.id;
              return (
                <div key={app.id} onClick={()=>setSelected(app.id)} style={{ background:active?"linear-gradient(135deg,#7c3aed,#4f46e5)":"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:14, textAlign:"center", cursor:"pointer" }}>
                  <div style={{ fontSize:18 }}>{app.icon}</div>
                  <div style={{ fontWeight:700, fontSize:12, marginTop:4 }}>{app.name}</div>
                  <div style={{ marginTop:6, fontWeight:900, fontSize:14, color:active?"white":"#22c55e" }}>₦{CUSTOMER_PRICE_NAIRA[app.id].toLocaleString()}</div>
                  <div style={{ fontSize:9, opacity:0.5 }}>{selectedCountry.f} {selectedCountry.d}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ height:"fit-content", position:"sticky", top:70 }}>
          <div style={{ background:"linear-gradient(180deg,#1a1a2e,#0f0f1e)", border:"1px solid rgba(139,92,246,0.3)", borderRadius:24, padding:20 }}>
            <div style={{ fontSize:10, opacity:0.5 }}>{APPS.find(a=>a.id===selected)?.name.toUpperCase()} • {selectedCountry.f} {selectedCountry.n}</div>
            <div style={{ fontSize:42, fontWeight:900, marginTop:6 }}>₦{finalPrice.toLocaleString()}</div>
            <div style={{ fontSize:11, background:"rgba(34,197,94,0.15)", padding:"8px 10px", borderRadius:10, color:"#22c55e", marginTop:8 }}>✅ Same price for 190+ countries<br/>✅ 5sim x10 already included</div>
            <button onClick={()=> wallet<finalPrice? setShowWallet(true) : setWallet(wallet-finalPrice)} style={{ width:"100%", marginTop:14, padding:15, borderRadius:12, background:"linear-gradient(90deg,#7c3aed,#4f46e5)", border:0, color:"white", fontWeight:900, cursor:"pointer" }}>Buy Now - {selectedCountry.f} {selectedCountry.d} 👛</button>
            <div style={{ fontSize:10, opacity:0.3, textAlign:"center", marginTop:10 }}>⚡ Instant • 190+ Countries</div>
          </div>
        </div>
      </div>

      <div style={{ position:"fixed", bottom:20, right:16, display:"flex", flexDirection:"column", gap:10, zIndex:40 }}>
        <a href="https://wa.me/2348084752266" target="_blank" style={{ width:56, height:56, borderRadius:50, background:"#25D366", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, textDecoration:"none" }}>💬</a>
      </div>

      {showWallet && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"#15151f", maxWidth:360, width:"100%", borderRadius:20, padding:20, border:"1px solid rgba(255,255,255,0.1)" }}>
            <h3 style={{ margin:0 }}>Fund Wallet 👛</h3>
            <div style={{ background:"black", borderRadius:14, padding:16, marginTop:12, textAlign:"center" }}><div style={{ fontSize:11, opacity:0.5 }}>Balance</div><div style={{ fontSize:28, fontWeight:900, color:"#22c55e" }}>₦{wallet.toLocaleString()}</div></div>
            <button onClick={()=>{ setWallet(wallet+5000); setShowWallet(false); }} style={{ width:"100%", marginTop:12, padding:14, borderRadius:12, background:"#22c55e", color:"black", border:0, fontWeight:900 }}>Add ₦5,000</button>
            <button onClick={()=>setShowWallet(false)} style={{ width:"100%", marginTop:8, padding:10, background:"rgba(255,255,255,0.1)", border:"1px solid #333", borderRadius:10, color:"white" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
