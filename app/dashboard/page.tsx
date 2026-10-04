"use client"
import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}
const supabase = getSupabase() as any;

const COUNTRIES = [
  { c:"ng", n:"Nigeria" }, { c:"us", n:"USA" }, { c:"gb", n:"UK" },
  { c:"gh", n:"Ghana" }, { c:"za", n:"South Africa" }, { c:"de", n:"Germany" },
];
const SERVICES = [
  { id:"whatsapp", n:"WhatsApp" }, { id:"telegram", n:"Telegram" },
  { id:"facebook", n:"Facebook" }, { id:"tiktok", n:"TikTok" },
  { id:"google", n:"Google" },
];

export default function Dashboard(){
  const [balance,setBalance]=useState(0);
  const [country,setCountry]=useState("ng");
  const [service,setService]=useState("whatsapp");
  const [loading,setLoading]=useState(false);
  const [activeNum,setActiveNum]=useState<any>(null);
  const [sms,setSms]=useState("");
  const [fundAmount,setFundAmount]=useState("");
  const [livePrice,setLivePrice]=useState(2500);
  const [userId,setUserId]=useState("");
  const router = useRouter();

  useEffect(()=>{
    const load=async()=>{
      if(!supabase) return;
      const {data:{user}}=await supabase.auth.getUser();
      if(!user) { router.push("/login"); return; }
      setUserId(user.id);
      const {data}=await supabase.from("wallets").select("balance").eq("user_id",user.id).single();
      if(data) setBalance(data.balance);
    };
    load();
  },[]);

  // Secure live price - customer only sees final price
  useEffect(()=>{
    const getPrice = async () => {
      try{
        const r = await fetch(`/api/prices?service=${service}&country=${country}`);
        const d = await r.json();
        if(d.price) setLivePrice(d.price);
      }catch{}
    }
    getPrice();
  }, [country, service]);

  const buyNumber=async()=>{
    setLoading(true); setSms("");
    try{
      const res=await fetch("/api/buy-number",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({country, service, user_id: userId})
      });
      const data=await res.json();
      if(!res.ok) throw new Error(data.error);
      setActiveNum(data);
      setBalance(data.balance);
    }catch(e:any){
      alert(e.message || "Failed - Check wallet balance");
    }
    setLoading(false);
  };

  const handleFund=async()=>{
    if(!fundAmount || Number(fundAmount) < 100) return alert("Enter at least ₦100");
    if(!supabase) return;
    const {data:{user}} = await supabase.auth.getUser();
    const res = await fetch("/api/paystack/init",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ email: user.email, amount: Number(fundAmount), user_id: user.id })
    });
    const d = await res.json();
    const url = d?.authorization_url || d?.data?.authorization_url;
    if(url) window.location.href = url;
    else alert(d.error || "Paystack init failed");
  };

  return(
    <div style={{minHeight:"100vh", background:"#08080f", color:"white", fontFamily:"Inter, sans-serif", padding:20}}>
      <div style={{maxWidth:900, margin:"0 auto"}}>
        <a href="/" style={{textDecoration:"none", color:"#22c55e", fontSize:13}}>← Back to Home</a>
        
        <div style={{background:"linear-gradient(135deg,#171727,#12121f)", border:"1px solid #232334", padding:20, borderRadius:20, marginTop:16, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div>
            <p style={{opacity:0.5, fontSize:11, margin:0, letterSpacing:1}}>WALLET BALANCE</p>
            <span style={{fontSize:28, fontWeight:900, color:"#22c55e"}}>₦{balance.toLocaleString()}</span>
          </div>
          <div style={{background:"rgba(34,197,94,0.15)", border:"1px solid rgba(34,197,94,0.3)", padding:"6px 12px",borderRadius:100,fontSize:11,color:"#22c55e", fontWeight:700}}>● LIVE</div>
        </div>

        <div style={{background:"#12121f", padding:18, borderRadius:18, border:"1px solid #232334", marginTop:16}}>
          <b style={{fontSize:13}}>Fund Wallet (Paystack)</b>
          <p style={{fontSize:11, color:"#6b7280", margin:"4px 0 12px"}}>Min ₦100 • Instant credit</p>
          <div style={{display:"flex", gap:8}}>
            <input type="number" placeholder="5000" value={fundAmount} onChange={e=>setFundAmount(e.target.value)} style={{flex:1, padding:12, background:"#08080f", border:"1px solid #232334", borderRadius:10, color:"white", outline:"none"}}/>
            <button onClick={handleFund} style={{padding:"12px 20px", background:"#22c55e", color:"black", border:0, borderRadius:10, fontWeight:900, cursor:"pointer"}}>Fund</button>
          </div>
        </div>

        {activeNum && (
          <div style={{background:"white", border:"2px solid #22c55e", color:"black", padding:16, borderRadius:16, marginTop:16}}>
            <b>Active Number:</b> {activeNum.phone}<br/>
            <b>SMS Code:</b> {sms||"Waiting for SMS..."}
          </div>
        )}
        
        <div style={{background:"#12121f", padding:18, borderRadius:18, border:"1px solid #232334", marginTop:16}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <b style={{fontSize:13}}>Buy Virtual Number</b>
            <span style={{fontSize:12, fontWeight:900, color:"#22c55e"}}>₦{livePrice.toLocaleString()}</span>
          </div>
          <div style={{display:"flex", gap:8, marginTop:14}}>
            <select value={country} onChange={e=>setCountry(e.target.value)} style={{flex:1,padding:12,background:"#08080f",border:"1px solid #232334",borderRadius:10,color:"white"}}>
              {COUNTRIES.map(c=> <option key={c.c} value={c.c}>{c.n}</option>)}
            </select>
            <select value={service} onChange={e=>setService(e.target.value)} style={{flex:1,padding:12,background:"#08080f",border:"1px solid #232334",borderRadius:10,color:"white"}}>
              {SERVICES.map(s=> <option key={s.id} value={s.id}>{s.n}</option>)}
            </select>
          </div>
          <button onClick={buyNumber} disabled={loading} style={{marginTop:14,width:"100%",padding:14,background:loading?"#2a2a3a":"linear-gradient(90deg,#7c3aed,#22c55e)",color:"white",border:0,borderRadius:12,fontWeight:900,cursor:"pointer"}}>
            {loading? "Buying...": `Buy Now - ₦${livePrice.toLocaleString()}`}
          </button>
          <div style={{textAlign:"center", fontSize:10, opacity:0.3, marginTop:10}}>Instant delivery • Code in 30s • One-time</div>
        </div>
      </div>
    </div>
  )
}
