"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js"
import { useRouter, useSearchParams } from "next/navigation"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!) as any;

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
  { c:"ua", n:"Ukraine", f:"🇺🇦", d:"+380" }, { c:"es", n:"Spain", f:"🇪🇸", d:"+34" },
  { c:"br", n:"Brazil", f:"🇧🇷", d:"+55" }, { c:"pl", n:"Poland", f:"🇵🇱", d:"+48" },
];
const APPS = [
  { id:"whatsapp", name:"WhatsApp", icon:"💬" }, { id:"telegram", name:"Telegram", icon:"✈️" },
  { id:"facebook", name:"Facebook", icon:"👥" }, { id:"tiktok", name:"TikTok", icon:"🎵" },
  { id:"google", name:"Google", icon:"🔍" }, { id:"instagram", name:"Instagram", icon:"📸" },
  { id:"signal", name:"Signal", icon:"🔒" }, { id:"line", name:"Line", icon:"💚" },
  { id:"binance", name:"Binance", icon:"🪙" }, { id:"openai", name:"OpenAI", icon:"🤖" },
  { id:"uber", name:"Uber", icon:"🚗" }, { id:"discord", name:"Discord", icon:"🎧" },
];

export default function HomeClient() {
  const [wallet, setWallet] = useState(0);
  const [showWallet, setShowWallet] = useState(false);
  const [selected, setSelected] = useState("whatsapp");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[6]);
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
  const [finalPrice, setFinalPrice] = useState(2150);
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(()=>{
    const fetchPrice = async () => {
      setPriceLoading(true);
      try{
        const res = await fetch(`/api/prices?service=${selected}&country=${selectedCountry.c}`);
        const data = await res.json();
        if(data.price) setFinalPrice(data.price);
      }catch{}
      setPriceLoading(false);
    }
    fetchPrice();
  }, [selected, selectedCountry]);

  useEffect(()=>{
    if(!supabase) { setLoadingAuth(false); return; }
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if(!session){ router.push("/login"); return }
      setUser(session.user)
      const { data } = await supabase.from("wallets").select("balance").eq("user_id", session.user.id).single()
      if(data) setWallet(data.balance)
      else { await supabase.from("wallets").insert({ user_id: session.user.id, balance: 0 }); setWallet(0) }
      setLoadingAuth(false)
      const funded = searchParams.get("funded");
      if(funded){ alert(`✅ Wallet funded with ₦${funded}!`); router.replace("/"); }
    }
    init()
  },[])

  useEffect(() => {
    if(!currentOrderId) return;
    setCheckStatus("Waiting for SMS... 10-30 sec");
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/buy-number?checkId=${currentOrderId}`);
        const data = await res.json();
        if(data.sms?.[0]?.code){ setSmsCode(data.sms[0].code); setCheckStatus("Code Received! ✅"); clearInterval(interval); }
        else if(data.status === "CANCELED" || data.status === "BANNED"){ setCheckStatus("Number expired - refunded ✅"); clearInterval(interval); }
      } catch{ setCheckStatus("Retrying..."); }
    }, 5000);
    return () => clearInterval(interval);
  }, [currentOrderId]);

  const handleBuy = async () => {
    if(wallet < finalPrice){ setShowWallet(true); return }
    setBuying(true); setSmsCode(""); setCurrentPhone(""); setCurrentOrderId(null); setCheckStatus("");
    try {
      const res = await fetch("/api/buy-number", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ country: selectedCountry.c, service: selected, user_id: user.id }) })
      const data = await res.json()
      if(!res.ok) throw new Error(data.error || "Failed")
      setWallet(data.balance); setLastPrice(data.price); setCurrentPhone(data.phone||""); setCurrentOrderId(data.orderId);
    } catch(e:any){ alert("Buy failed: "+e.message) }
    setBuying(false)
  }

  const handleCancel = async () => {
    if(!currentOrderId) return; if(!confirm(`Cancel? ₦${lastPrice} will be refunded!`)) return;
    setCheckStatus("Canceling...");
    try{ const res = await fetch(`/api/cancel`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ orderId: currentOrderId }) }); const data = await res.json(); if(!res.ok) throw new Error(data.error); setWallet(data.balance); setCurrentOrderId(null); setCurrentPhone(""); setSmsCode(""); setCheckStatus(""); }catch(e:any){ alert(e.message) }
  }
  const handleComplete = async () => { if(!currentOrderId) return; await fetch(`/api/buy-number?checkId=${currentOrderId}&action=finish`); await supabase.from("orders").update({ status: "completed" }).eq("provider_id", currentOrderId); setCurrentOrderId(null); setCurrentPhone(""); setSmsCode(""); setCheckStatus(""); }
  const fundWithPaystack = async (amount: number) => { if(!amount || amount < 100) return alert("Enter at least ₦100"); const res = await fetch("/api/paystack/init", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email: user.email, amount, user_id: user.id }) }); const data = await res.json(); const url = data.authorization_url || data.data?.authorization_url; if(url) window.location.href = url; else alert("Paystack error") }
  const logout = async () => { if(supabase) await supabase.auth.signOut(); router.push("/login") }
  const filtered = COUNTRIES.filter(x=>x.n.toLowerCase().includes(search.toLowerCase()));
  if(loadingAuth) return <div style={{ minHeight:"100vh", background:"#08080f", color:"white", display:"flex", alignItems:"center", justifyContent:"center" }}>Loading...</div>

  return (
    <div style={{ minHeight:"100vh", background:"#08080f", color:"white", fontFamily:"Inter, sans-serif" }}>
      <style>{`
       .main-layout { display:flex; flex-direction:column; gap:20px; max-width:1180px; margin:0 auto; padding:16px; }
        @media(min-width: 900px){.main-layout { flex-direction:row; }.left-col { flex:1; }.right-col { width:380px; } }
        @media(max-width: 899px){.right-col { position:fixed; bottom:0; left:0; right:0; z-index:40; padding:12px; background:linear-gradient(to top, #08080f 80%, transparent); } }
      `}</style>

      <header style={{ display:"flex", justifyContent:"space-between", padding:"12px 16px", borderBottom:"1px solid #1e1e2e", position:"sticky", top:0, background:"rgba(8,8,15,0.9)", backdropFilter:"blur(20px)", zIndex:20 }}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#7c3aed,#22c55e)",display:"grid",placeItems:"center",fontWeight:900}}>P</div>
          <b>PerryNobe</b>
          <button onClick={()=>router.push("/history")} style={{marginLeft:8, padding:"5px 10px",borderRadius:20,background:"#1a1a2e",border:"1px solid #2a2a3a",color:"white",fontSize:11}}>History</button>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div onClick={()=>setShowWallet(true)} style={{ background:"#12121f", border:"1px solid #232334", padding:"6px 12px", borderRadius:100, cursor:"pointer", fontSize:12 }}><span style={{opacity:0.5}}>Balance </span><b style={{ color:"#22c55e" }}>₦{wallet.toLocaleString()}</b></div>
          <button onClick={logout} style={{ padding:"6px 12px", borderRadius:100, background:"#1a1a2e", border:"1px solid #2a2a3a", color:"white", fontSize:11 }}>Logout</button>
        </div>
      </header>

      <div className="main-layout">
        {/* LEFT - Stacked */}
        <div className="left-col" style={{display:"flex", flexDirection:"column", gap:16, paddingBottom:160}}>
          {/* SERVICES FIRST */}
          <div>
            <h3 style={{ fontSize:11, opacity:0.5, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Select Service</h3>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
              {APPS.map(app=>{
                const active=selected===app.id;
                return (
                  <div key={app.id} onClick={()=>setSelected(app.id)} style={{ background:active?"linear-gradient(135deg,#7c3aed,#6d28d9)":"#12121f", border:active?"1px solid #7c3aed":"1px solid #232334", borderRadius:16, padding:14, cursor:"pointer", boxShadow:active?"0 0 20px rgba(124,58,237,0.35)":"none" }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ fontSize:18 }}>{app.icon}</span><span style={{fontSize:8, background:"rgba(255,255,255,0.15)", padding:"3px 6px", borderRadius:20}}>INSTANT</span></div>
                    <div style={{ fontWeight:800, fontSize:12, marginTop:8 }}>{app.name}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* COUNTRY SECOND - FULL LIST */}
          <div style={{ background:"#12121f", border:"1px solid #232334", borderRadius:20, padding:14 }}>
            <div style={{display:"flex",justifyContent:"space-between"}}><b style={{ fontSize:12 }}>Select Country</b><span style={{fontSize:9,padding:"3px 8px",borderRadius:100,background:"rgba(34,197,94,0.15)",color:"#22c55e"}}>● Live</span></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search USA, Nigeria..." style={{ width:"100%", marginTop:10, padding:"11px 14px", borderRadius:10, background:"#08080f", border:"1px solid #232334", color:"white", outline:"none" }} />
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:10, maxHeight:360, overflowY:"auto" }}>
              {filtered.map(c=>(
                <div key={c.c} onClick={()=>setSelectedCountry(c)} style={{ padding:"12px 14px", borderRadius:12, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", background:selectedCountry.c===c.c?"#1e1e2e":"#08080f", border:selectedCountry.c===c.c?"1px solid #7c3aed":"1px solid #232334" }}>
                  <span style={{fontSize:13}}>{c.f} {c.n}</span><span style={{fontSize:12, opacity:0.4}}>{c.d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT - Checkout Card */}
        <div className="right-col">
          <div style={{ background:"linear-gradient(180deg,#171727,#0f0f1a)", border:"1px solid #2a2a4a", borderRadius:24, padding:18 }}>
            <div style={{ fontSize:9, opacity:0.4, letterSpacing:1, textAlign:"center" }}>{APPS.find(a=>a.id===selected)?.name.toUpperCase()} • {selectedCountry.f} {selectedCountry.n.toUpperCase()}</div>
            <div style={{ display:"flex", justifyContent:"center", alignItems:"baseline", gap:8, marginTop:6 }}>
              <div style={{ fontSize:38, fontWeight:900 }}>₦{finalPrice.toLocaleString()}</div>
              {priceLoading && <div style={{fontSize:10,opacity:0.4}}>...</div>}
            </div>
            <div style={{ display:"flex", gap:6, justifyContent:"center", marginTop:8 }}>
              <div style={{ fontSize:10, background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.2)", padding:"5px 8px", borderRadius:100, color:"#22c55e" }}>✓ Instant</div>
              <div style={{ fontSize:10, background:"rgba(124,58,237,0.12)", border:"1px solid rgba(124,58,237,0.2)", padding:"5px 8px", borderRadius:100, color:"#a78bfa" }}>✓ Working</div>
            </div>

            <button onClick={handleBuy} disabled={buying} style={{ width:"100%", marginTop:14, padding:14, borderRadius:12, background:"linear-gradient(90deg,#7c3aed,#22c55e)", border:0, color:"white", fontWeight:900, cursor:"pointer" }}>
              {buying? "Processing...":`Buy Now - ${selectedCountry.d}`}
            </button>
            <div style={{textAlign:"center", fontSize:9, opacity:0.3, marginTop:8}}>One-time fee • No subscription • Code in 30s</div>

            {currentOrderId && (
              <div style={{ marginTop:14, padding:14, background:"white", borderRadius:16, color:"#000" }}>
                <div style={{fontWeight:800, fontSize:11, opacity:0.5}}>YOUR NUMBER</div>
                <div style={{fontWeight:900, fontSize:16, marginTop:4, display:"flex", justifyContent:"space-between"}}>{currentPhone}<button onClick={()=>navigator.clipboard.writeText(currentPhone)} style={{padding:"4px 8px", borderRadius:6, border:"1px solid #000", background:"black", color:"white", fontSize:10, fontWeight:800}}>COPY</button></div>
                {smsCode? (
                  <div style={{marginTop:12, padding:12, background:"#f5f3ff", borderRadius:12, textAlign:"center", border:"1.5px solid #7c3aed"}}>
                    <div style={{fontSize:28, fontWeight:900, letterSpacing:3, color:"#7c3aed"}}>{smsCode}</div>
                    <button onClick={()=>navigator.clipboard.writeText(smsCode)} style={{marginTop:8, width:"100%", padding:"10px", borderRadius:8, background:"#7c3aed", color:"white", border:0, fontWeight:800}}>COPY CODE</button>
                    <button onClick={handleComplete} style={{width:"100%", marginTop:8, padding:12, borderRadius:8, background:"#111827", color:"white", border:0, fontWeight:900}}>✅ COMPLETE</button>
                  </div>
                ) : ( <div style={{marginTop:10, fontSize:11, background:"#fef3c7", padding:10, borderRadius:10, textAlign:"center"}}>⏳ {checkStatus}</div> )}
                <button onClick={handleCancel} style={{width:"100%", marginTop:8, padding:8, borderRadius:8, background:"#ef4444", border:0, color:"white", fontSize:10, fontWeight:900}}>Cancel & Refund ₦{lastPrice}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showWallet && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"#15151f", maxWidth:360, width:"100%", borderRadius:20, padding:20, border:"1px solid #2a2a3a" }}>
            <h3 style={{ margin:0, fontSize:16 }}>Fund Wallet</h3>
            <p style={{ fontSize:11, opacity:0.5 }}>{user?.email}</p>
            <div style={{ background:"#08080f", borderRadius:14, padding:14, marginTop:12, textAlign:"center", border:"1px solid #232334" }}><div style={{ fontSize:10, opacity:0.5 }}>Balance</div><div style={{ fontSize:26, fontWeight:900, color:"#22c55e" }}>₦{wallet.toLocaleString()}</div></div>
            <input type="number" value={fundAmount} onChange={e=>setFundAmount(e.target.value)} placeholder="5000" style={{width:"100%",marginTop:14,padding:12,borderRadius:10,background:"#08080f",border:"1px solid #2a2a3a",color:"white", outline:"none"}} />
            <button onClick={()=>fundWithPaystack(Number(fundAmount))} style={{ width:"100%", marginTop:10, padding:12, borderRadius:10, background:"#22c55e", color:"black", border:0, fontWeight:900 }}>Fund with Paystack</button>
            <button onClick={()=>setShowWallet(false)} style={{ width:"100%", marginTop:8, padding:8, background:"transparent", border:0, color:"white", opacity:0.4 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
