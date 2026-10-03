"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PRICE_MATRIX: Record<string, Record<string, number>> = {
  whatsapp: { us: 1890, gb: 1840, ca: 1870, au: 1920, de: 1790, fr: 1810, ng: 1808, gh: 1760, za: 1780, ke: 1720, in: 1650, id: 1680, ph: 1690, my: 1740, sg: 1980, ae: 1950, tr: 1820, ru: 1710, ua: 1700, pl: 1780, es: 1830, br: 1790, mx: 1800, jp: 1990, sa: 1900, eg: 1720, pk: 1640, bd: 1630, th: 1710, vn: 1660, it: 1850, nl: 1880, se: 1890, ch: 1960 },
  telegram: { us: 1720, gb: 1680, ca: 1700, au: 1750, de: 1620, fr: 1640, ng: 1648, gh: 1600, za: 1620, ke: 1580, in: 1480, id: 1510, ph: 1520, my: 1590, sg: 1800, ae: 1780, tr: 1660, ru: 1540, ua: 1530, pl: 1610, es: 1670, br: 1630, mx: 1640, jp: 1820, sa: 1740, eg: 1570, pk: 1470, bd: 1460, th: 1550, vn: 1490, it: 1680, nl: 1710, se: 1720, ch: 1790 },
  facebook: { us: 1100, gb: 1060, ca: 1080, au: 1120, de: 1010, fr: 1020, ng: 1024, gh: 990, za: 1010, ke: 970, in: 890, id: 920, ph: 930, my: 980, sg: 1180, ae: 1150, tr: 1040, ru: 950, ua: 940, pl: 1000, es: 1050, br: 1020, mx: 1030, jp: 1200, sa: 1120, eg: 960, pk: 880, bd: 870, th: 960, vn: 900, it: 1060, nl: 1090, se: 1100, ch: 1170 },
  tiktok: { us: 2010, gb: 1960, ca: 1990, au: 2040, de: 1900, fr: 1920, ng: 1920, gh: 1880, za: 1900, ke: 1840, in: 1760, id: 1790, ph: 1800, my: 1860, sg: 2100, ae: 2070, tr: 1940, ru: 1830, ua: 1820, pl: 1900, es: 1950, br: 1910, mx: 1920, jp: 2120, sa: 2020, eg: 1840, pk: 1750, bd: 1740, th: 1830, vn: 1770, it: 1970, nl: 2000, se: 2010, ch: 2090 },
  google: { us: 560, gb: 540, ca: 550, au: 580, de: 500, fr: 510, ng: 512, gh: 490, za: 500, ke: 470, in: 420, id: 440, ph: 450, my: 480, sg: 620, ae: 600, tr: 530, ru: 460, ua: 450, pl: 490, es: 520, br: 500, mx: 510, jp: 640, sa: 570, eg: 460, pk: 410, bd: 400, th: 460, vn: 430, it: 540, nl: 550, se: 560, ch: 610 },
};
const FALLBACK: Record<string, number> = {
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
function getPrice(service: string, country: string) {
  const matrix = PRICE_MATRIX[service];
  if(matrix && matrix[country]) return matrix[country];
  const base = FALLBACK[service] || 1000;
  const variance: Record<string, number> = { us:1.08, gb:1.05, ca:1.06, au:1.09, sg:1.12, ae:1.10, jp:1.13, ch:1.11, de:1.02, fr:1.03, in:0.92, id:0.94, pk:0.90, bd:0.89, ng:1.0, gh:0.97, ke:0.96 };
  const mult = variance[country] || 1;
  return Math.round(base * mult);
}

export default function Home() {
  const [wallet, setWallet] = useState(0);
  const [showWallet, setShowWallet] = useState(false);
  const [selected, setSelected] = useState("whatsapp");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[6]);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [buying, setBuying] = useState(false);
  const [fundAmount, setFundAmount] = useState(""); // NEW - any amount
  const router = useRouter()

  useEffect(()=>{
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if(!session){ router.push("/login"); return }
      setUser(session.user)
      const { data } = await supabase.from("wallets").select("balance").eq("user_id", session.user.id).single()
      if(data) setWallet(data.balance)
      else {
        await supabase.from("wallets").insert({ user_id: session.user.id, balance: 0 })
        setWallet(0)
      }
      setLoadingAuth(false)
    }
    init()
  },[])

  const handleBuy = async () => {
    if(wallet < finalPrice){ setShowWallet(true); return }
    setBuying(true)
    try {
      const res = await fetch("/api/buy-number", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ country: selectedCountry.c, service: selected, user_id: user.id, price: finalPrice })
      })
      const data = await res.json()
      if(!res.ok) throw new Error(data.error || "Failed")
      setWallet(w=>w-finalPrice)
      alert(`Success! Number: ${data.phone}`)
    } catch(e:any){ alert("Buy failed: "+e.message) }
    setBuying(false)
  }

  const fundWithPaystack = async (amount: number) => {
    if(!amount || amount < 100) return alert("Enter at least ₦100");
    const res = await fetch("/api/paystack/init", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ email: user.email, amount: amount * 100, user_id: user.id })
    })
    const data = await res.json()
    if(data.authorization_url) window.location.href = data.authorization_url
    else alert("Paystack error: "+JSON.stringify(data))
  }

  const logout = async () => { await supabase.auth.signOut(); router.push("/login") }
  const finalPrice = getPrice(selected, selectedCountry.c);
  const filtered = COUNTRIES.filter(x=>x.n.toLowerCase().includes(search.toLowerCase()));
  if(loadingAuth) return <div style={{ minHeight:"100vh", background:"#08080f", color:"white", display:"flex", alignItems:"center", justifyContent:"center" }}>Loading...</div>

  return (
    <div style={{ minHeight:"100vh", background:"#08080f", color:"white", fontFamily:"sans-serif" }}>
      <header style={{ display:"flex", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.1)", position:"sticky", top:0, background:"rgba(8,8,15,0.9)", backdropFilter:"blur(20px)", zIndex:10 }}>
        <b>🟣 PerryNobe • {user?.email}</b>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div onClick={()=>setShowWallet(true)} style={{ background:"rgba(255,255,255,0.1)", padding:"8px 16px", borderRadius:100, cursor:"pointer" }}>👛 <b style={{ color:"#22c55e" }}>₦{wallet.toLocaleString()}</b></div>
          <button onClick={logout} style={{ padding:"6px 12px", borderRadius:8, background:"rgba(255,255,255,0.1)", border:"1px solid #333", color:"white" }}>Logout</button>
        </div>
      </header>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:16, display:"grid", gridTemplateColumns:"1fr 360px", gap:16 }}>
        <div>
          <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:12 }}>
            <b style={{ fontSize:13 }}>🌍 Select Country</b>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search USA, Nigeria..." style={{ width:"100%", marginTop:10, padding:10, borderRadius:10, background:"#000", border:"1px solid #333", color:"white" }} />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))", gap:8, marginTop:10, maxHeight:220, overflowY:"auto" }}>
              {filtered.map(c=>{
                const p = getPrice(selected, c.c);
                return (
                <div key={c.c} onClick={()=>setSelectedCountry(c)} style={{ padding:9, borderRadius:10, cursor:"pointer", background:selectedCountry.c===c.c?"linear-gradient(135deg,#7c3aed,#4f46e5)":"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", fontSize:12 }}>
                  {c.f} {c.n}<div style={{ fontSize:10, opacity:0.6 }}>{c.d} • ₦{p}</div>
                </div>
              )})}
            </div>
          </div>
          <h3 style={{ margin:"14px 0 10px 0", fontSize:13, opacity:0.8 }}>Choose Service</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:10 }}>
            {APPS.map(app=>{
              const active=selected===app.id;
              const p=getPrice(app.id, selectedCountry.c);
              return (
                <div key={app.id} onClick={()=>setSelected(app.id)} style={{ background:active?"linear-gradient(135deg,#7c3aed,#4f46e5)":"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:14, textAlign:"center", cursor:"pointer" }}>
                  <div style={{ fontSize:18 }}>{app.icon}</div>
                  <div style={{ fontWeight:700, fontSize:12, marginTop:4 }}>{app.name}</div>
                  <div style={{ marginTop:6, fontWeight:900, fontSize:14, color:active?"white":"#22c55e" }}>₦{p.toLocaleString()}</div>
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
            <div style={{ fontSize:11, background:"rgba(34,197,94,0.15)", padding:"8px 10px", borderRadius:10, color:"#22c55e", marginTop:8 }}>✅ Instant Delivery<br/>✅ Valid for 20 mins • 99.9% success</div>
            <button onClick={handleBuy} disabled={buying} style={{ width:"100%", marginTop:14, padding:15, borderRadius:12, background:"linear-gradient(90deg,#7c3aed,#4f46e5)", border:0, color:"white", fontWeight:900, cursor:"pointer" }}>{buying?"Buying...":`Buy Now - ${selectedCountry.f} ${selectedCountry.d} 👛`}</button>
            <div style={{ fontSize:10, opacity:0.3, textAlign:"center", marginTop:10 }}>⚡ Delivered in &lt;10s • 190+ Countries</div>
          </div>
        </div>
      </div>

      {showWallet && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"#15151f", maxWidth:380, width:"100%", borderRadius:20, padding:20, border:"1px solid rgba(255,255,255,0.1)" }}>
            <h3 style={{ margin:0 }}>Fund Wallet 👛</h3>
            <p style={{ fontSize:12, opacity:0.6 }}>{user?.email}</p>
            <div style={{ background:"black", borderRadius:14, padding:16, marginTop:12, textAlign:"center" }}><div style={{ fontSize:11, opacity:0.5 }}>Balance (Real DB)</div><div style={{ fontSize:28, fontWeight:900, color:"#22c55e" }}>₦{wallet.toLocaleString()}</div></div>

            <div style={{marginTop:16}}>
              <label style={{fontSize:12, fontWeight:700, opacity:0.8}}>Enter Any Amount - Min ₦100</label>
              <input type="number" value={fundAmount} onChange={e=>setFundAmount(e.target.value)} placeholder="e.g 500, 1000, 5000, 20000" style={{width:"100%",marginTop:8,padding:14,borderRadius:12,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.2)",color:"white", fontSize:16, fontWeight:700}} />
            </div>

            <button onClick={()=>fundWithPaystack(Number(fundAmount))} style={{ width:"100%", marginTop:12, padding:14, borderRadius:12, background:"#22c55e", color:"black", border:0, fontWeight:900, fontSize:15 }}>Fund ₦{fundAmount || "___"} with Paystack LIVE ✅</button>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:10}}>
              <button onClick={()=>setFundAmount("1000")} style={{padding:10,borderRadius:10,background:"rgba(255,255,255,0.1)",border:"1px solid #333",color:"white",fontWeight:700}}>₦1k</button>
              <button onClick={()=>setFundAmount("5000")} style={{padding:10,borderRadius:10,background:"rgba(255,255,255,0.1)",border:"1px solid #333",color:"white",fontWeight:700}}>₦5k</button>
              <button onClick={()=>setFundAmount("10000")} style={{padding:10,borderRadius:10,background:"rgba(255,255,255,0.1)",border:"1px solid #333",color:"white",fontWeight:700}}>₦10k</button>
            </div>

            <button onClick={()=>setShowWallet(false)} style={{ width:"100%", marginTop:10, padding:10, background:"transparent", border:0, borderRadius:10, color:"white", opacity:0.5 }}>Close</button>
            <p style={{fontSize:10, opacity:0.4, textAlign:'center', marginTop:8}}>✅ Paystack LIVE • Any amount works • Instant credit</p>
          </div>
        </div>
      )}
    </div>
  );
}
