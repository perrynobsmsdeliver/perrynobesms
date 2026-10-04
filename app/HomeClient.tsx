"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js"
import { useRouter, useSearchParams } from "next/navigation"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url ||!key) return null
  return createClient(url, key)
}
const supabase = getSupabase() as any;

const PROFIT_X = 10;
const NAIRA_RATE = 1600; // $1 = ₦1600, change this if dollar changes

const COUNTRIES = [
  { c:"us", n:"USA", f:"🇺🇸", d:"+1", full:"usa" }, { c:"gb", n:"UK", f:"🇬🇧", d:"+44", full:"england" },
  { c:"ca", n:"Canada", f:"🇨🇦", d:"+1", full:"canada" }, { c:"au", n:"Australia", f:"🇦🇺", d:"+61", full:"australia" },
  { c:"de", n:"Germany", f:"🇩🇪", d:"+49", full:"germany" }, { c:"fr", n:"France", f:"🇫🇷", d:"+33", full:"france" },
  { c:"ng", n:"Nigeria", f:"🇳🇬", d:"+234", full:"nigeria" }, { c:"gh", n:"Ghana", f:"🇬🇭", d:"+233", full:"ghana" },
  { c:"za", n:"South Africa", f:"🇿🇦", d:"+27", full:"southafrica" }, { c:"ke", n:"Kenya", f:"🇰🇪", d:"+254", full:"kenya" },
  { c:"in", n:"India", f:"🇮🇳", d:"+91", full:"india" }, { c:"id", n:"Indonesia", f:"🇮🇩", d:"+62", full:"indonesia" },
  { c:"ph", n:"Philippines", f:"🇵🇭", d:"+63", full:"philippines" }, { c:"my", n:"Malaysia", f:"🇲🇾", d:"+60", full:"malaysia" },
  { c:"sg", n:"Singapore", f:"🇸🇬", d:"+65", full:"singapore" }, { c:"ae", n:"UAE", f:"🇦🇪", d:"+971", full:"uae" },
  { c:"tr", n:"Turkey", f:"🇹🇷", d:"+90", full:"turkey" }, { c:"ru", n:"Russia", f:"🇷🇺", d:"+7", full:"russia" },
  { c:"ua", n:"Ukraine", f:"🇺🇦", d:"+380", full:"ukraine" },
  // add rest...
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

export default function HomeClient() {
  const [wallet, setWallet] = useState(0);
  const [showWallet, setShowWallet] = useState(false);
  const [selected, setSelected] = useState("whatsapp");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[4] as any);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [buying, setBuying] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const router = useRouter()
  const searchParams = useSearchParams();

  const [currentPhone, setCurrentPhone] = useState("");
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [smsCode, setSmsCode] = useState("");
  const [checkStatus, setCheckStatus] = useState("");
  const [lastPrice, setLastPrice] = useState(0);

  // LIVE PRICES FROM 5SIM
  const [livePrices, setLivePrices] = useState<any>(null);

  useEffect(()=>{
    // Fetch live 5sim prices once
    fetch("/api/live-prices").then(r=>r.json()).then(data=>{
      console.log("Live 5sim:", data);
      setLivePrices(data);
    }).catch(()=>{});
  }, []);

  function getPrice(service: string, countryCode: string) {
    const countryObj = COUNTRIES.find(c=>c.c===countryCode);
    const fullName = countryObj?.full || countryCode;

    // 1. Try live price: e.g data.whatsapp.nigeria.cost = $0.134
    if(livePrices && livePrices[service] && livePrices[service][fullName]) {
      const costDollar = livePrices[service][fullName].cost;
      const costNaira = costDollar * NAIRA_RATE; // $0.134 * 1600 = ₦214
      const sellPrice = Math.ceil(costNaira * PROFIT_X / 50) * 50; // ×10 = ₦2140, round to 50
      return sellPrice;
    }
    // 2. Fallback if live never load - use 214 base for whatsapp NG
    const baseMap: any = { whatsapp: 214, telegram: 180, facebook: 120, tiktok: 240, google: 65 };
    const base = baseMap[service] || 200;
    return base * PROFIT_X;
  }

  useEffect(()=>{
    if(!supabase) { setLoadingAuth(false); return; }
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
      const funded = searchParams.get("funded");
      if(funded){
        alert(`✅ Wallet funded with ₦${funded}!`);
        router.replace("/");
        const { data: fresh } = await supabase.from("wallets").select("balance").eq("user_id", session.user.id).single()
        if(fresh) setWallet(fresh.balance)
      }
    }
    init()
  },[])

  useEffect(() => {
    if(!currentOrderId) return;
    setCheckStatus("Waiting for SMS... checking 5sim every 5s");
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/buy-number?checkId=${currentOrderId}`);
        const data = await res.json();
        if(data.sms && data.sms.length > 0 && data.sms[0].code){
          setSmsCode(data.sms[0].code);
          setCheckStatus("Code Received! ✅ Copy and use it");
          clearInterval(interval);
        } else if(data.status === "CANCELED" || data.status === "BANNED"){
          setCheckStatus("Canceled - Money refunded ✅");
          clearInterval(interval);
        } else {
          setCheckStatus(`Status: ${data.status || 'WAITING_SMS'} - checking again in 5s...`);
        }
      } catch(e){
        setCheckStatus("Network error, retrying...");
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [currentOrderId]);

  const handleBuy = async () => {
    if(wallet < finalPrice){ setShowWallet(true); return }
    setBuying(true)
    setSmsCode(""); setCurrentPhone(""); setCurrentOrderId(null); setCheckStatus("");
    try {
      const res = await fetch("/api/buy-number", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ country: selectedCountry.c, service: selected, user_id: user.id })
      })
      const data = await res.json()
      if(!res.ok) throw new Error(data.error || "Failed")
      setWallet(data.balance)
      setLastPrice(data.price || finalPrice)
      setCurrentPhone(data.phone || data.number || "");
      setCurrentOrderId(data.orderId || data.id || data.order_id);
    } catch(e:any){ alert("Buy failed: "+e.message) }
    setBuying(false)
  }

  const handleCancel = async () => {
    if(!currentOrderId) return;
    if(!confirm(`Cancel this number? ₦${lastPrice} will be refunded to wallet!`)) return;
    setCheckStatus("Canceling and refunding...");
    try{
      const res = await fetch(`/api/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: currentOrderId })
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || "Cancel failed");
      setWallet(data.balance);
      setCurrentOrderId(null); setCurrentPhone(""); setSmsCode(""); setCheckStatus("");
      alert(`Canceled! ₦${data.balance} new balance ✅`);
    }catch(e:any){ alert("Cancel failed: "+e.message) }
  }

  const handleComplete = async () => {
    if(!currentOrderId) return;
    if(!confirm(`Mark as settled? This will clear the number.`)) return;
    try{
      await supabase.from("orders").update({ status: "completed" }).eq("provider_id", currentOrderId);
      await fetch(`/api/buy-number?checkId=${currentOrderId}&action=finish`);
      setCurrentOrderId(null); setCurrentPhone(""); setSmsCode(""); setCheckStatus("");
      alert("Order completed ✅ You can buy another number now!");
    }catch(e:any){ setCurrentOrderId(null); setCurrentPhone(""); setSmsCode(""); setCheckStatus(""); }
  }

  const fundWithPaystack = async (amount: number) => {
    if(!amount || amount < 100) return alert("Enter at least ₦100");
    const res = await fetch("/api/paystack/init", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ email: user.email, amount: amount, user_id: user.id })
    })
    const data = await res.json()
    const url = data.authorization_url || data.url || data.data?.authorization_url
    if(url) window.location.href = url
    else alert("Paystack error: "+JSON.stringify(data))
  }

  const logout = async () => { if(supabase) await supabase.auth.signOut(); router.push("/login") }
  const finalPrice = getPrice(selected, selectedCountry.c);
  const filtered = COUNTRIES.filter(x=>x.n.toLowerCase().includes(search.toLowerCase()));
  if(loadingAuth) return <div style={{ minHeight:"100vh", background:"#08080f", color:"white", display:"flex", alignItems:"center", justifyContent:"center" }}>Loading...</div>

  return (
    <div style={{ minHeight:"100vh", background:"#08080f", color:"white", fontFamily:"sans-serif" }}>
      <header style={{ display:"flex", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.1)", position:"sticky", top:0, background:"rgba(8,8,15,0.9)", backdropFilter:"blur(20px)", zIndex:10 }}>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <b>🟣 PerryNobe</b>
          <button onClick={()=>router.push("/history")} style={{padding:"6px 12px",borderRadius:8,background:"rgba(124,58,237,0.2)",border:"1px solid rgba(124,58,237,0.4)",color:"white",fontSize:12,cursor:"pointer"}}>📜 History</button>
          <span style={{fontSize:11,opacity:0.5}}>{user?.email}</span>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div onClick={()=>setShowWallet(true)} style={{ background:"rgba(255,255,255,0.1)", padding:"8px 16px", borderRadius:100, cursor:"pointer" }}>👛 <b style={{ color:"#22c55e" }}>₦{wallet.toLocaleString()}</b></div>
          <button onClick={logout} style={{ padding:"6px 12px", borderRadius:8, background:"rgba(255,255,255,0.1)", border:"1px solid #333", color:"white",cursor:"pointer" }}>Logout</button>
        </div>
      </header>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:16, display:"grid", gridTemplateColumns:"1fr 360px", gap:16 }}>
        <div>
          <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:12 }}>
            <b style={{ fontSize:13 }}>🌍 Select Country {livePrices? "🟢 Live" : "🔴 Loading live prices..."}</b>
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
            <div style={{ fontSize:11, background:"rgba(34,197,94,0.15)", padding:"8px 10px", borderRadius:10, color:"#22c55e", marginTop:8 }}>✅ Instant Delivery<br/>✅ Valid for 20 mins • 99.9% success<br/>Live cost ×{PROFIT_X} profit</div>
            <button onClick={handleBuy} disabled={buying} style={{ width:"100%", marginTop:14, padding:15, borderRadius:12, background:"linear-gradient(90deg,#7c3aed,#4f46e5)", border:0, color:"white", fontWeight:900, cursor:"pointer" }}>{buying?"Buying...":`Buy Now - ${selectedCountry.f} ${selectedCountry.d} 👛`}</button>
            <div style={{ fontSize:10, opacity:0.3, textAlign:"center", marginTop:10 }}>⚡ Delivered in &lt;10s • 190+ Countries</div>

            {currentOrderId && (
              <div style={{ marginTop:16, padding:16, background:"#fef3c7", borderRadius:14, border:"2px solid #fcd34d", color:"#000" }}>
                <div style={{fontWeight:800, fontSize:13}}>📱 Your Number:</div>
                <div style={{fontWeight:900, fontSize:18, marginTop:4, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  {currentPhone}
                  <button onClick={()=>navigator.clipboard.writeText(currentPhone)} style={{padding:"4px 8px", borderRadius:6, border:"1px solid #000", fontSize:11, fontWeight:800}}>COPY</button>
                </div>
                <div style={{marginTop:12, height:1, background:"rgba(0,0,0,0.1)"}}></div>
                <div style={{fontWeight:800, fontSize:13, marginTop:12}}>🔑 SMS Code:</div>
                {smsCode? (
                  <div style={{marginTop:6, padding:12, background:"white", borderRadius:10, textAlign:"center", border:"2px solid #7c3aed"}}>
                    <div style={{fontSize:28, fontWeight:900, letterSpacing:4, color:"#7c3aed"}}>{smsCode}</div>
                    <button onClick={()=>navigator.clipboard.writeText(smsCode)} style={{marginTop:8, padding:"6px 12px", borderRadius:8, background:"#7c3aed", color:"white", border:0, fontWeight:800, cursor:"pointer"}}>COPY CODE</button>
                    <div style={{fontSize:10, marginTop:6, color:"#22c55e", fontWeight:700}}>{checkStatus}</div>
                    <button onClick={handleComplete} style={{width:"100%", marginTop:12, padding:14, borderRadius:10, background:"#22c55e", border:0, color:"black", fontWeight:900, cursor:"pointer", fontSize:14}}>✅ COMPLETE ORDER - SETTLED</button>
                  </div>
                ) : (
                  <div style={{marginTop:6, fontSize:12, color:"#92400e"}}>⏳ {checkStatus || "Waiting..."}<br/><span style={{fontSize:10}}>Auto checking every 5 seconds. Don't close page!</span></div>
                )}
                <div style={{marginTop:12, display:"flex", gap:8}}>
                  <button onClick={handleCancel} style={{flex:1, padding:10, borderRadius:8, background:"#ef4444", border:0, color:"white", fontSize:11, fontWeight:900, cursor:"pointer"}}>❌ Cancel & Refund ₦{lastPrice}</button>
                  <button onClick={()=>{setSmsCode(""); setCheckStatus("Retrying...")}} style={{flex:1, padding:10, borderRadius:8, background:"rgba(0,0,0,0.08)", border:"1px solid #000", color:"black", fontSize:11, fontWeight:700, cursor:"pointer"}}>🔄 Refresh</button>
                </div>
                <div style={{marginTop:10, fontSize:10, opacity:0.6}}>Order ID: {currentOrderId}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showWallet && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"#15151f", maxWidth:380, width:"100%", borderRadius:20, padding:20, border:"1px solid rgba(255,255,255,0.1)" }}>
            <h3 style={{ margin:0 }}>Fund Wallet 👛</h3>
            <p style={{ fontSize:12, opacity:0.6 }}>{user?.email}</p>
            <div style={{ background:"black", borderRadius:14, padding:16, marginTop:12, textAlign:"center" }}><div style={{ fontSize:11, opacity:0.5 }}>Balance</div><div style={{ fontSize:28, fontWeight:900, color:"#22c55e" }}>₦{wallet.toLocaleString()}</div></div>
            <div style={{marginTop:16}}>
              <label style={{fontSize:12, fontWeight:700, opacity:0.8}}>Enter Any Amount - Min ₦100</label>
              <input type="number" value={fundAmount} onChange={e=>setFundAmount(e.target.value)} placeholder="e.g 500, 1000, 5000" style={{width:"100%",marginTop:8,padding:14,borderRadius:12,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.2)",color:"white", fontSize:16, fontWeight:700}} />
            </div>
            <button onClick={()=>fundWithPaystack(Number(fundAmount))} style={{ width:"100%", marginTop:12, padding:14, borderRadius:12, background:"#22c55e", color:"black", border:0, fontWeight:900, fontSize:15 }}>Fund ₦{fundAmount || "___"} with Paystack ✅</button>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:10}}>
              <button onClick={()=>setFundAmount("1000")} style={{padding:10,borderRadius:10,background:"rgba(255,255,255,0.1)",border:"1px solid #333",color:"white",fontWeight:700}}>₦1k</button>
              <button onClick={()=>setFundAmount("5000")} style={{padding:10,borderRadius:10,background:"rgba(255,255,255,0.1)",border:"1px solid #333",color:"white",fontWeight:700}}>₦5k</button>
              <button onClick={()=>setFundAmount("10000")} style={{padding:10,borderRadius:10,background:"rgba(255,255,255,0.1)",border:"1px solid #333",color:"white",fontWeight:700}}>₦10k</button>
            </div>
            <button onClick={()=>setShowWallet(false)} style={{ width:"100%", marginTop:10, padding:10, background:"transparent", border:0, borderRadius:10, color:"white", opacity:0.5 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
