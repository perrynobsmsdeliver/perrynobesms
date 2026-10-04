"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js"
import { useRouter, useSearchParams } from "next/navigation"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!) as any;

const SUPPORT_WA = "2348084752266";
const SUPPORT_DISPLAY = "08084752266";
const SUPPORT_EMAIL = "elettapeace123@gmail.com";

const COUNTRIES = [
  { c:"us", n:"USA", f:"🇺🇸", d:"+1" }, { c:"gb", n:"UK", f:"🇬🇧", d:"+44" },
  { c:"ca", n:"Canada", f:"🇨🇦", d:"+1" },
  { c:"gh", n:"Ghana", f:"🇬🇭", d:"+233" }, { c:"za", n:"South Africa", f:"🇿🇦", d:"+27" },
  { c:"de", n:"Germany", f:"🇩🇪", d:"+49" }, { c:"fr", n:"France", f:"🇫🇷", d:"+33" },
  { c:"at", n:"Austria", f:"🇦🇹", d:"+43" }, { c:"au", n:"Australia", f:"🇦🇺", d:"+61" },
  { c:"nl", n:"Netherlands", f:"🇳🇱", d:"+31" }, { c:"se", n:"Sweden", f:"🇸🇪", d:"+46" },
  { c:"pl", n:"Poland", f:"🇵🇱", d:"+48" }, { c:"in", n:"India", f:"🇮🇳", d:"+91" },
  { c:"id", n:"Indonesia", f:"🇮🇩", d:"+62" }, { c:"br", n:"Brazil", f:"🇧🇷", d:"+55" },
  { c:"ru", n:"Russia", f:"🇷🇺", d:"+7" }, { c:"tr", n:"Turkey", f:"🇹🇷", d:"+90" },
];

const APPS = [
  { id:"whatsapp", name:"WhatsApp", icon:"💬" }, { id:"telegram", name:"Telegram", icon:"✈️" },
  { id:"facebook", name:"Facebook", icon:"👥" }, { id:"tiktok", name:"TikTok", icon:"🎵" },
  { id:"google", name:"Google", icon:"🔍" }, { id:"instagram", name:"Instagram", icon:"📸" },
  { id:"signal", name:"Signal", icon:"🔐" }, { id:"tumblr", name:"Tumblr", icon:"🌀" },
  { id:"apple", name:"Apple", icon:"🍎" }, { id:"twitter", name:"Twitter/X", icon:"🐦" },
  { id:"discord", name:"Discord", icon:"🎮" }, { id:"amazon", name:"Amazon", icon:"🛒" },
  { id:"uber", name:"Uber", icon:"🚗" }, { id:"netflix", name:"Netflix", icon:"🎬" },
  { id:"microsoft", name:"Microsoft", icon:"🪟" }, { id:"yahoo", name:"Yahoo", icon:"📧" },
  { id:"snapchat", name:"Snapchat", icon:"👻" }, { id:"linkedin", name:"LinkedIn", icon:"💼" },
  { id:"openai", name:"OpenAI", icon:"🤖" }, { id:"paypal", name:"PayPal", icon:"💳" },
];

export default function HomeClient() {
  const [view, setView] = useState<"buy"|"wallet"|"history">("buy");
  const [menuOpen, setMenuOpen] = useState(false);
  const [wallet, setWallet] = useState(0);
  const [selected, setSelected] = useState("whatsapp");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [buying, setBuying] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [currentPhone, setCurrentPhone] = useState("");
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [smsCode, setSmsCode] = useState("");
  const [finalPrice, setFinalPrice] = useState(2150);
  const router = useRouter(); const searchParams = useSearchParams();

  useEffect(()=>{
    fetch(`/api/prices?service=${selected}&country=${selectedCountry.c}`).then(r=>r.json()).then(d=>{ if(d.price) setFinalPrice(d.price) })
  }, [selected, selectedCountry]);

  useEffect(()=>{
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if(!session){ router.push("/login"); return }
      setUser(session.user)
      const { data } = await supabase.from("wallets").select("balance").eq("user_id", session.user.id).single()
      if(data) setWallet(data.balance)
      const { data: orders } = await supabase.from("orders").select("*").eq("user_id", session.user.id).order("created_at",{ascending:false}).limit(20)
      if(orders) setHistory(orders)
      setLoadingAuth(false)
    }; init()
  },[])

  const handleBuy = async () => {
    if(wallet < finalPrice){ setView("wallet"); return }
    setBuying(true); setSmsCode(""); setCurrentPhone(""); setCurrentOrderId(null);
    const res = await fetch("/api/buy-number", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ country: selectedCountry.c, service: selected, user_id: user.id }) })
    const data = await res.json(); setBuying(false);
    if(res.ok){ setWallet(data.balance); setCurrentPhone(data.phone); setCurrentOrderId(data.orderId); }
    else alert(data.error)
  }

  // --- YOUR CALLBACK MATCHED HERE - NO RELOAD ---
  const fundWithPaystack = () => {
    const amount = Number(fundAmount);
    if(!amount || amount < 100) return alert("Min ₦100");
    // @ts-ignore
    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: user.email,
      amount: amount * 100,
      currency: "NGN",
      ref: `PERRY_${Date.now()}_${user.id.slice(0,6)}`,
      callback: async function (response: any) {
        try {
          const res = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reference: response.reference,
              amount,
              user_id: user.id,
              email: user.email
            })
          });
          const result = await res.json();
          if (result.success) {
            setWallet(result.new_balance);
            setFundAmount("");
            alert(`✅ Success! ₦${amount} added. New balance: ₦${result.new_balance}`);
          } else {
            alert("⚠️ Deposited but verification slow: " + result.error);
            const { data } = await supabase.from("wallets").select("balance").eq("user_id", user.id).single();
            if (data) setWallet(data.balance);
          }
        } catch (e) {
          alert("Network slow but money don enter - refresh wallet you go see am");
        }
      },
      onClose: function() {}
    });
    handler.openIframe();
  }

  if(loadingAuth) return <div style={{ minHeight:"100vh", background:"#08080f", color:"white", display:"grid", placeItems:"center" }}>Loading...</div>
  const filtered = COUNTRIES.filter(x=>x.n.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ minHeight:"100vh", background:"#08080f", color:"white", fontFamily:"Inter" }}>
      <header style={{ display:"flex", justifyContent:"space-between", padding:"12px 16px", borderBottom:"1px solid #1e1e2e", position:"sticky", top:0, background:"rgba(8,8,15,0.9)", backdropFilter:"blur(20px)", zIndex:20 }}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button onClick={()=>setMenuOpen(true)} style={{width:36,height:36,borderRadius:10,background:"#12121f",border:"1px solid #232334",color:"white",fontSize:18}}>☰</button>
          <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#7c3aed,#22c55e)",display:"grid",placeItems:"center",fontWeight:900}}>P</div><b>PerryNobe</b>
        </div>
        <div onClick={()=>setView("wallet")} style={{ background:"#12121f", border:"1px solid #232334", padding:"6px 14px", borderRadius:100, cursor:"pointer", fontSize:12 }}><span style={{opacity:0.5}}>Bal </span><b style={{ color:"#22c55e" }}>₦{wallet.toLocaleString()}</b></div>
      </header>
      {menuOpen && (
        <div style={{position:"fixed", inset:0, zIndex:50, display:"flex"}}>
          <div onClick={()=>setMenuOpen(false)} style={{flex:1, background:"rgba(0,0,0,0.6)"}}></div>
          <div style={{width:320, background:"#12121f", borderLeft:"1px solid #232334", padding:18, display:"flex", flexDirection:"column", gap:14, overflowY:"auto"}}>
            <div style={{background:"#08080f", border:"1px solid #232334", borderRadius:16, padding:16, textAlign:"center"}}>
              <div style={{width:60,height:60,borderRadius:100,background:"linear-gradient(135deg,#7c3aed,#22c55e)",display:"grid",placeItems:"center",fontSize:24, margin:"0 auto", fontWeight:900}}>{user.email[0].toUpperCase()}</div>
              <div style={{fontWeight:800, marginTop:10, fontSize:13, wordBreak:"break-all"}}>{user.email}</div>
              <div style={{fontSize:11, opacity:0.5, marginTop:4}}>ID: {user.id.slice(0,8)}...</div>
              <div style={{marginTop:12, background:"#1a1a2e", padding:"8px", borderRadius:10}}><span style={{opacity:0.5,fontSize:11}}>Wallet</span><div style={{color:"#22c55e", fontWeight:900, fontSize:18}}>₦{wallet.toLocaleString()}</div></div>
            </div>
            <button onClick={()=>{setView("buy"); setMenuOpen(false)}} style={{padding:14,borderRadius:12,background:view==="buy"?"#7c3aed":"#08080f",border:"1px solid #232334",color:"white",textAlign:"left",fontWeight:700}}>🛒 Buy Numbers</button>
            <button onClick={()=>{setView("wallet"); setMenuOpen(false)}} style={{padding:14,borderRadius:12,background:view==="wallet"?"#7c3aed":"#08080f",border:"1px solid #232334",color:"white",textAlign:"left",fontWeight:700}}>💰 Fund Wallet</button>
            <button onClick={()=>{setView("history"); setMenuOpen(false)}} style={{padding:14,borderRadius:12,background:view==="history"?"#7c3aed":"#08080f",border:"1px solid #232334",color:"white",textAlign:"left",fontWeight:700}}>📜 History ({history.length})</button>
            <div style={{background:"#08080f", border:"1px solid #232334", borderRadius:14, padding:12}}>
              <div style={{fontSize:10, fontWeight:800, opacity:0.5, letterSpacing:1, marginBottom:10}}>CUSTOMER SUPPORT 24/7</div>
              <a href={`https://wa.me/${SUPPORT_WA}`} target="_blank" style={{display:"flex", gap:10, padding:"12px", background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.25)", borderRadius:10, color:"#22c55e", textDecoration:"none", fontSize:13, fontWeight:800, marginBottom:8}}>💬 WhatsApp<br/>{SUPPORT_DISPLAY}</a>
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{display:"block", padding:"10px", background:"rgba(124,58,237,0.12)", border:"1px solid rgba(124,58,237,0.2)", borderRadius:10, color:"#a78bfa", textDecoration:"none", fontSize:11, fontWeight:600, wordBreak:"break-all"}}>✉️ {SUPPORT_EMAIL}</a>
            </div>
            <div style={{marginTop:"auto"}}>
              <button onClick={async()=>{ await supabase.auth.signOut(); router.push("/login") }} style={{width:"100%", padding:12,borderRadius:12,background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",color:"#ef4444",fontWeight:800}}>Logout</button>
            </div>
            <button onClick={()=>setMenuOpen(false)} style={{padding:10,background:"transparent",border:0,color:"white",opacity:0.4}}>Close</button>
          </div>
        </div>
      )}
      <div style={{maxWidth:500, margin:"0 auto", padding:16, paddingBottom:120}}>
        {view==="buy" && (
          <>
            <h3 style={{ fontSize:11, opacity:0.5, letterSpacing:1, marginBottom:10 }}>SELECT SERVICE</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {APPS.map(app=>{
                const active=selected===app.id;
                return <div key={app.id} onClick={()=>setSelected(app.id)} style={{ background:active?"linear-gradient(135deg,#7c3aed,#6d28d9)":"#12121f", border:active?"1px solid #7c3aed":"1px solid #232334", borderRadius:16, padding:14, cursor:"pointer" }}><div style={{fontSize:18}}>{app.icon}</div><div style={{fontWeight:800,fontSize:12,marginTop:8}}>{app.name}</div></div>
              })}
            </div>
            <div style={{ background:"#12121f", border:"1px solid #232334", borderRadius:16, padding:12, marginTop:16 }}>
              <b style={{fontSize:12}}>Select Country</b>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{width:"100%",marginTop:8,padding:10,borderRadius:10,background:"#08080f",border:"1px solid #232334",color:"white"}}/>
              <div style={{marginTop:10, display:"flex",flexDirection:"column",gap:6, maxHeight:280, overflowY:"auto"}}>
                {filtered.map(c=>(
                  <div key={c.c} onClick={()=>setSelectedCountry(c)} style={{padding:"10px 12px",borderRadius:10,display:"flex",justifyContent:"space-between", background:selectedCountry.c===c.c?"#1e1e2e":"#08080f", border:selectedCountry.c===c.c?"1px solid #7c3aed":"1px solid #232334", cursor:"pointer"}}><span>{c.f} {c.n}</span><span style={{opacity:0.4}}>{c.d}</span></div>
                ))}
              </div>
            </div>
            <div style={{ background:"#171727", border:"1px solid #2a2a4a", borderRadius:20, padding:16, marginTop:16 }}>
              <div style={{textAlign:"center",fontSize:10,opacity:0.4}}>{APPS.find(a=>a.id===selected)?.name.toUpperCase()} • {selectedCountry.n}</div>
              <div style={{textAlign:"center",fontSize:32,fontWeight:900,marginTop:4}}>₦{finalPrice.toLocaleString()}</div>
              <button onClick={handleBuy} disabled={buying} style={{width:"100%",marginTop:12,padding:14,borderRadius:12,background:"linear-gradient(90deg,#7c3aed,#22c55e)",border:0,color:"white",fontWeight:900}}>{buying?"Buying...":`Buy Now - ${selectedCountry.d}`}</button>
              {currentPhone && <div style={{marginTop:12,background:"white",color:"black",padding:12,borderRadius:12,textAlign:"center"}}><b>{currentPhone}</b><br/><span style={{color:"#7c3aed",fontWeight:900,fontSize:20}}>{smsCode||"Waiting..."}</span></div>}
            </div>
          </>
        )}
        {view==="wallet" && (
          <div style={{background:"#12121f",border:"1px solid #232334",borderRadius:20,padding:20,marginTop:10}}>
            <h3 style={{margin:0}}>Fund Wallet</h3>
            <div style={{background:"#08080f",borderRadius:14,padding:16,marginTop:14,textAlign:"center"}}><div style={{opacity:0.5,fontSize:11}}>Balance</div><div style={{fontSize:28,fontWeight:900,color:"#22c55e"}}>₦{wallet.toLocaleString()}</div></div>
            <input type="number" value={fundAmount} onChange={e=>setFundAmount(e.target.value)} placeholder="e.g 5000" style={{width:"100%",marginTop:16,padding:14,borderRadius:12,background:"#08080f",border:"1px solid #2a2a3a",color:"white"}}/>
            <button onClick={fundWithPaystack} style={{width:"100%",marginTop:12,padding:14,borderRadius:12,background:"#22c55e",color:"black",fontWeight:900,border:0}}>Fund with Paystack</button>
          </div>
        )}
        {view==="history" && (
          <div style={{marginTop:10}}>
            <h3 style={{fontSize:13,opacity:0.6}}>Order History</h3>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:10}}>
              {history.map(o=>(
                <div key={o.id} style={{background:"#12121f",border:"1px solid #232334",borderRadius:12,padding:12,display:"flex",justifyContent:"space-between"}}>
                  <div><div style={{fontWeight:800,fontSize:13}}>{o.service} • {o.country}</div><div style={{fontSize:11,opacity:0.5}}>{new Date(o.created_at).toLocaleString()}</div></div>
                  <div style={{textAlign:"right"}}><div style={{fontWeight:900,color:"#22c55e"}}>₦{o.sold_price||o.price}</div><div style={{fontSize:10}}>{o.status}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
