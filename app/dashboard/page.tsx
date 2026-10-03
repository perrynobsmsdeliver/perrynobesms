"use client"
import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Dashboard(){
  const [balance,setBalance]=useState(0);
  const [country,setCountry]=useState("nigeria");
  const [service,setService]=useState("whatsapp");
  const [loading,setLoading]=useState(false);
  const [activeNum,setActiveNum]=useState<any>(null);
  const [sms,setSms]=useState("");

  useEffect(()=>{
    const load=async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user) return;
      const {data}=await supabase.from("wallets").select("balance").eq("user_id",user.id).single();
      if(data) setBalance(data.balance);
    };
    load();
  },[]);

  const buyNumber=async()=>{
    setLoading(true); setSms("");
    const res=await fetch("/api/buy-number",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({country,service})});
    const data=await res.json(); setLoading(false);
    if(data.phone){setActiveNum(data); alert(`Number: ${data.phone}`);} else{alert(data.error||"Failed")}
  };

  return(
    <div style={{padding:24,maxWidth:900,margin:'0 auto',fontFamily:'system-ui'}}>
      <a href="/" style={{textDecoration:'none'}}>← Back to Home</a>
      <h2 style={{marginTop:16}}>Dashboard - REAL BALANCE</h2>
      <div style={{background:'#111827',color:'white',padding:20,borderRadius:16,marginTop:12,display:'flex',justifyContent:'space-between'}}>
        <span>Wallet Balance: ₦{balance.toLocaleString()}</span>
        <a href="/wallet" style={{background:'#22c55e',padding:'6px 12px',borderRadius:20,fontSize:12,color:'white',textDecoration:'none'}}>Fund +</a>
      </div>
      {activeNum&&<div style={{background:'#ecfdf5',border:'1px solid #22c55e',padding:16,borderRadius:12,marginTop:16}}><b>Active:</b> {activeNum.phone}<br/><b>SMS:</b> {sms||"Waiting..."}</div>}
      <div style={{background:'white',padding:16,borderRadius:12,border:'1px solid #e5e7eb',marginTop:16}}>
        <b>Buy Virtual Number</b><br/>
        <div style={{display:'flex',gap:8,marginTop:12}}>
          <select value={country} onChange={e=>setCountry(e.target.value)} style={{flex:1,padding:10,border:'1px solid #ddd',borderRadius:8}}>
            <option value="nigeria">Nigeria - ₦250</option>
            <option value="usa">USA - ₦300</option>
          </select>
          <select value={service} onChange={e=>setService(e.target.value)} style={{flex:1,padding:10,border:'1px solid #ddd',borderRadius:8}}>
            <option value="whatsapp">WhatsApp</option>
            <option value="telegram">Telegram</option>
          </select>
        </div>
        <button onClick={buyNumber} disabled={loading} style={{marginTop:12,width:'100%',padding:12,background:loading?'#9ca3af':'#111827',color:'white',border:0,borderRadius:8,fontWeight:'bold'}}>{loading?"Buying...":"Buy Number Now"}</button>
      </div>
    </div>
  )
}
