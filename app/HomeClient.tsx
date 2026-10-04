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
  { c:"br", n:"Brazil", f:"🇧🇷", d:"+55" }, { c:"br", n:"Brazil", f:"🇧🇷", d:"+55" },
  { c:"pl", n:"Poland", f:"🇵🇱", d:"+48" },
];
const APPS = [
  { id:"whatsapp", name:"WhatsApp", icon:"💬" }, { id:"telegram", name:"Telegram", icon:"✈️" },
  { id:"facebook", name:"Facebook", icon:"👥" }, { id:"tiktok", name:"TikTok", icon:"🎵" },
  { id:"google", name:"Google", icon:"🔍" }, { id:"instagram", name:"Instagram", icon:"📸" },
  { id:"signal", name:"Signal", icon:"🔒" }, { id:"line", name:"Line", icon:"💚" },
  { id:"binance", name:"Binance", icon:"🪙" }, { id:"openai", name:"OpenAI", icon:"🤖" },
  { id:"uber", name:"Uber", icon:"🚗" }, { id:"discord", name:"Discord", icon:"🎧" },
  { id:"amazon", name:"Amazon", icon:"📦" }, { id:"paypal", name:"PayPal", icon:"💳" },
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
  const [finalPrice, setFinalPrice] = useState(2500);
  const [priceLoading, setPriceLoading] = useState(false);

  // SECURE PRICE FETCH - customer only sees final price
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
    setCheckStatus("Waiting for SMS... 10-30 sec");
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/buy-number?checkId=${currentOrderId}`);
        const data = await res.json();
        if(data.sms?.[0]?.code){
          setSmsCode(data.sms[0].code);
          setCheckStatus("Code Received! ✅");
          clearInterval(interval);
        } else if(data.status === "CANCELED" || data.status === "BANNED"){
          setCheckStatus("Number expired - refunded ✅");
          clearInterval(interval);
        }
      } catch{
        setCheckStatus("Retrying...");
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
      setLastPrice(data.price)
      setCurrentPhone(data.phone || "");
      setCurrentOrderId(data.orderId);
    } catch(e:any){ alert("Buy failed: "+e.message) }
    setBuying(false)
  }

  const handleCancel = async () => {
    if(!currentOrderId) return;
    if(!confirm(`Cancel? ₦${lastPrice} will be refunded!`)) return;
    setCheckStatus("Canceling...");
    try{
      const res = await fetch(`/api/cancel`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: currentOrderId })
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error);
      setWallet(data.balance);
      setCurrentOrderId(null); setCurrentPhone(""); setSmsCode("");
      setCheckStatus("");
    }catch(e:any){ alert(e.message) }
  }

  const handleComplete = async () => {
    if(!currentOrderId) return;
    await fetch(`/api/buy-number?checkId=${currentOrderId}&action=finish`);
    await supabase.from("orders").update({ status: "completed" }).eq("provider_id", currentOrderId);
    setCurrentOrderId(null); setCurrentPhone(""); setSmsCode(""); setCheckStatus("");
  }

  const fundWithPaystack = async (amount: number) => {
    if(!amount || amount < 100) return alert("Enter at least ₦100");
    const res = await fetch("/api/paystack/init", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ email: user.email, amount, user_id: user.id })
    })
    const data = await res.json()
    const url = data.authorization_url || data.data?.authorization_url
    if(url) window.location.href = url
    else alert("Paystack error")
  }

  const logout = async () => { if(supabase) await supabase.auth.signOut(); router.push("/login") }
  const filtered = COUNTRIES.filter(x=>x.n.toLowerCase().includes(search.toLowerCase()));
  if(loadingAuth) return <div style={{ minHeight:"100vh", background:"#08080f", color:"white", display:"flex", alignItems:"center", justifyContent:"center" }}>Loading...</div>

  return (
    <div style={{ minHeight:"100vh", background:"#08080f", color:"white", fontFamily:"Inter, sans-serif" }}>
      {/* HEADER - Premium */}
      <header style={{ display:"flex", justifyContent:"space-between", padding:"16px 24px", borderBottom:"1px solid #1e1e2e", position:"sticky", top:0, background:"rgba(8,8,15,0.85)", backdropFilter:"blur(20px)", zIndex:10 }}>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#7c3aed,#22c55e)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900}}>P</div>
          <b style={{letterSpacing:0.5}}>PerryNobe</b>
          <div style={{width:1,height:18,background:"#2a2a3a"}}></div>
          <button onClick={()=>router.push("/history")} style={{padding:"6px 12px",borderRadius:8,background:"#1a1a2e",border:"1px solid #2a2a3a",color:"white",fontSize:12,cursor:"pointer"}}>History</button>
          <span style={{fontSize:11,opacity:0.4,display:"none"}} className="md:block">{user?.email}</span>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div onClick={()=>setShowWallet(true)} style={{ background:"#1a1a2e", border:"1px solid #2e2e4a", padding:"8px 14px", borderRadius:100, cursor:"pointer", display:"flex", gap:6, alignItems:"center" }}>
            <span style={{opacity:0.5,fontSize:12}}>Balance</span> <b style={{ color:"#22c55e" }}>₦{wallet.toLocaleString()}</b>
          </div>
          <button onClick={logout} style={{ padding:"8px 14px", borderRadius:100, background:"rgba(255,255,255,0.06)", border:"1px solid #2a2a3a", color:"white",cursor:"pointer", fontSize:12 }}>Logout</button>
        </div>
      </header>

      <div style={{ maxWidth:1180, margin:"0 auto", padding:20, display:"grid", gridTemplateColumns:"1fr 380px", gap:20 }}>
        {/* LEFT */}
        <div>
          <div style={{ background:"#12121f", border:"1px solid #232334", borderRadius:20, padding:16 }}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <b style={{ fontSize:13 }}>Select Country</b>
              <span style={{fontSize:10,padding:"4px 8px",borderRadius:100,background:"rgba(34,197,94,0.15)",color:"#22c55e"}}>● Live • Instant</span>
            </div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search USA, Nigeria..." style={{ width:"100%", marginTop:12, padding:"12px 14px", borderRadius:12, background:"#08080f", border:"1px solid #232334", color:"white", outline:"none" }} />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:8, marginTop:12, maxHeight:200, overflowY:"auto" }}>
              {filtered.map(c=>(
                <div key={c.c} onClick={()=>setSelectedCountry(c)} style={{ padding:10, borderRadius:12, cursor:"pointer", background:selectedCountry.c===c.c?"#7c3aed":"#1a1a2e", border:selectedCountry.c===c.c?"1px solid #7c3aed":"1px solid #232334", fontSize:12, transition:"all 0.2s" }}>
                  {c.f} {c.n}<div style={{ fontSize:10, opacity:0.5, marginTop:2 }}>{c.d}</div>
                </div>
              ))}
            </div>
          </div>

          <h3 style={{ margin:"18px 0 12px 0", fontSize:13, opacity:0.6, letterSpacing:1, textTransform:"uppercase" }}>Select Service</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(115px,1fr))", gap:10 }}>
            {APPS.map(app=>{
              const active=selected===app.id;
              return (
                <div key={app.id} onClick={()=>setSelected(app.id)} style={{ background:active?"linear-gradient(135deg,#7c3aed,#4f46e5)":"#12121f", border:active?"1px solid #7c3aed":"1px solid #232334", borderRadius:18, padding:16, textAlign:"center", cursor:"pointer", transform:active?"scale(1.02)":"scale(1)" }}>
                  <div style={{ fontSize:20 }}>{app.icon}</div>
                  <div style={{ fontWeight:700, fontSize:12, marginTop:6 }}>{app.name}</div>
                  <div style={{ fontSize:9, opacity:0.5, marginTop:4, letterSpacing:0.5 }}>INSTANT • {selectedCountry.f}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT - Checkout */}
        <div style={{ height:"fit-content", position:"sticky", top:84 }}>
          <div style={{ background:"linear-gradient(180deg,#171727,#0f0f1a)", border:"1px solid #2a2a4a", borderRadius:28, padding:22, boxShadow:"0 20px 60px rgba(124,58,237,0.15)" }}>
            <div style={{ fontSize:10, opacity:0.4, letterSpacing:1 }}>{APPS.find(a=>a.id===selected)?.name.toUpperCase()} NUMBER • {selectedCountry.f} {selectedCountry.n.toUpperCase()}</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:8, marginTop:8 }}>
              <div style={{ fontSize:46, fontWeight:900, letterSpacing:-1 }}>₦{finalPrice.toLocaleString()}</div>
              {priceLoading && <div style={{fontSize:11,opacity:0.4}}>updating...</div>}
            </div>
            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              <div style={{ fontSize:11, background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.2)", padding:"6px 10px", borderRadius:100, color:"#22c55e" }}>✓ Instant Delivery</div>
              <div style={{ fontSize:11, background:"rgba(124,58,237,0.12)", border:"1px solid rgba(124,58,237,0.2)", padding:"6px 10px", borderRadius:100, color:"#a78bfa" }}>✓ 100% Working</div>
            </div>

            <button onClick={handleBuy} disabled={buying} style={{ width:"100%", marginTop:18, padding:16, borderRadius:14, background:"linear-gradient(90deg,#7c3aed,#22c55e)", border:0, color:"white", fontWeight:900, cursor:"pointer", fontSize:14, letterSpacing:0.3 }}>
              {buying? "Processing...":`Buy Now - ${selectedCountry.f} ${selectedCountry.d}`}
            </button>
            <div style={{textAlign:"center", fontSize:10, opacity:0.35, marginTop:10}}>One-time fee • No subscription • Code in 30s</div>

            {currentOrderId && (
              <div style={{ marginTop:18, padding:16, background:"white", borderRadius:18, color:"#000" }}>
                <div style={{fontWeight:800, fontSize:12, opacity:0.6}}>YOUR NUMBER</div>
                <div style={{fontWeight:900, fontSize:18, marginTop:4, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  {currentPhone}
                  <button onClick={()=>navigator.clipboard.writeText(currentPhone)} style={{padding:"6px 10px", borderRadius:8, border:"1px solid #111", fontSize:11, fontWeight:800, background:"black", color:"white", cursor:"pointer"}}>COPY</button>
                </div>
                <div style={{marginTop:14, height:1, background:"#eee"}}></div>
                <div style={{fontWeight:800, fontSize:12, marginTop:14, opacity:0.6}}>SMS CODE</div>
                {smsCode? (
                  <div style={{marginTop:8, padding:14, background:"#f5f3ff", borderRadius:14, textAlign:"center", border:"2px solid #7c3aed"}}>
                    <div style={{fontSize:32, fontWeight:900, letterSpacing:4, color:"#7c3aed"}}>{smsCode}</div>
                    <button onClick={()=>navigator.clipboard.writeText(smsCode)} style={{marginTop:10, padding:"8px 16px", borderRadius:10, background:"#7c3aed", color:"white", border:0, fontWeight:800, cursor:"pointer", width:"100%"}}>COPY CODE</button>
                    <div style={{fontSize:11, marginTop:8, color:"#22c55e", fontWeight:700}}>{checkStatus}</div>
                    <button onClick={handleComplete} style={{width:"100%", marginTop:12, padding:14, borderRadius:10, background:"#111827", border:0, color:"white", fontWeight:900, cursor:"pointer"}}>✅ COMPLETE ORDER</button>
                  </div>
                ) : (
                  <div style={{marginTop:8, fontSize:12, color:"#92400e", background:"#fef3c7", padding:12, borderRadius:12, textAlign:"center"}}>⏳ {checkStatus}</div>
                )}
                <button onClick={handleCancel} style={{width:"100%", marginTop:10, padding:10, borderRadius:10, background:"#ef4444", border:0, color:"white", fontSize:11, fontWeight:900, cursor:"pointer"}}>Cancel & Refund ₦{lastPrice}</button>
              </div>
            )}
          </div>
          <div style={{textAlign:"center", fontSize:11, opacity:0.25, marginTop:14}}>🔒 Secure • Encrypted • 24/7 Support</div>
        </div>
      </div>

      {showWallet && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"#15151f", maxWidth:380, width:"100%", borderRadius:24, padding:22, border:"1px solid #2a2a3a" }}>
            <h3 style={{ margin:0 }}>Fund Wallet</h3>
            <p style={{ fontSize:12, opacity:0.5 }}>{user?.email}</p>
            <div style={{ background:"#08080f", borderRadius:16, padding:18, marginTop:14, textAlign:"center", border:"1px solid #232334" }}><div style={{ fontSize:11, opacity:0.5 }}>Balance</div><div style={{ fontSize:30, fontWeight:900, color:"#22c55e" }}>₦{wallet.toLocaleString()}</div></div>
            <input type="number" value={fundAmount} onChange={e=>setFundAmount(e.target.value)} placeholder="Amount e.g 5000" style={{width:"100%",marginTop:16,padding:14,borderRadius:12,background:"#08080f",border:"1px solid #2a2a3a",color:"white", fontSize:16, fontWeight:700, outline:"none"}} />
            <button onClick={()=>fundWithPaystack(Number(fundAmount))} style={{ width:"100%", marginTop:12, padding:14, borderRadius:12, background:"#22c55e", color:"black", border:0, fontWeight:900, fontSize:14 }}>Fund with Paystack</button>
            <button onClick={()=>setShowWallet(false)} style={{ width:"100%", marginTop:10, padding:10, background:"transparent", border:0, borderRadius:10, color:"white", opacity:0.4, cursor:"pointer" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
