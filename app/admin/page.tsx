"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js"

function getSupabase(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [txs, setTxs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  const checkPass = async () => {
    const res = await fetch("/api/admin/check", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ password: pass })
    });
    if(res.ok){ setAuthed(true); } else { alert("Wrong password"); }
  }

  useEffect(()=>{
    if(!authed) return;
    const supabase = getSupabase()
    supabase.from("orders").select("*").order("created_at",{ascending:false}).limit(100).then(({data})=>{ if(data) setOrders(data) })
    supabase.from("wallets").select("*").order("balance",{ascending:false}).limit(100).then(({data})=>{ if(data) setWallets(data) })
    supabase.from("transactions").select("*").order("created_at",{ascending:false}).limit(100).then(({data})=>{ if(data) setTxs(data) })
  },[authed])

  // FIXED PROFIT LOGIC - TIMES 10 = 90% PROFIT
  const totalSales = orders.reduce((a,b)=>a+(b.price||0), 0);
  const totalCost = Math.round(totalSales / 10); // cost is 10% because you sell ×10
  const totalProfit = totalSales - totalCost; // profit is 90%
  const totalWalletBal = wallets.reduce((a,b)=>a+(Number(b.balance)||0),0);

  if (!authed) {
    return (
      <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#111827', padding:16, fontFamily:'sans-serif'}}>
        <div style={{background:'white', padding:32, borderRadius:16, width:'100%', maxWidth:380, textAlign:'center'}}>
          <div style={{fontSize:32}}>🔒</div>
          <h2 style={{margin:'12px 0 4px', color:'#111827'}}>Private Admin</h2>
          <p style={{color:'#6b7280', fontSize:14}}>Enter password to access LIVE data</p>
          <input type="password" placeholder="Admin Password" value={pass} onChange={(e)=>setPass(e.target.value)} onKeyDown={(e)=>e.key==='Enter' && checkPass()} style={{width:'100%', padding:12, borderRadius:8, border:'1px solid #d1d5db', boxSizing:'border-box', marginTop:12, color:'#111'}} />
          <button onClick={checkPass} style={{width:'100%', marginTop:12, background:'#111827', color:'white', padding:12, borderRadius:8, border:0, cursor:'pointer', fontWeight:700}}>Unlock Admin</button>
          <a href="/" style={{display:'block', marginTop:16, color:'#6b7280', fontSize:13, textDecoration:'none'}}>← Back to Website</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh', background:'#08080f', color:'white', fontFamily:'sans-serif'}}>
      <header style={{background:'#111827', padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <b>PerryNobeSMS - LIVE ADMIN ×10</b>
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          <span style={{fontSize:11, background:'#065f46', padding:'6px 10px', borderRadius:20}}>LIVE • ₦{totalWalletBal.toLocaleString()} in wallets</span>
          <button onClick={()=>setAuthed(false)} style={{background:'#374151', color:'white', border:0, padding:'8px 12px', borderRadius:8, cursor:'pointer'}}>Logout</button>
        </div>
      </header>

      <div style={{padding:24, maxWidth:1150, margin:'0 auto'}}>
        <div style={{display:'flex', gap:8}}>
          {["overview","orders","users","funding"].map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)} style={{ padding:"8px 16px", borderRadius:20, border:0, background: activeTab===t? "#7c3aed" : "rgba(255,255,255,0.1)", color:"white", cursor:"pointer", textTransform:"capitalize", fontWeight:600}}>{t}</button>
          ))}
        </div>

        {activeTab==="overview" && (
          <>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:14, marginTop:20}}>
              <div style={{background:'rgba(255,255,255,0.06)', padding:20, borderRadius:16}}><div style={{color:'#9ca3af', fontSize:12}}>TOTAL SALES</div><div style={{fontSize:28, fontWeight:800, marginTop:6, color:'#22c55e'}}>₦{totalSales.toLocaleString()}</div><div style={{fontSize:10, opacity:0.5, marginTop:4}}>₦214 → ₦2,200 each</div></div>
              <div style={{background:'rgba(124,58,237,0.18)', padding:20, borderRadius:16, border:'1px solid rgba(124,58,237,0.3)'}}><div style={{color:'#a78bfa', fontSize:12}}>YOUR PROFIT EST. (90%)</div><div style={{fontSize:28, fontWeight:800, marginTop:6, color:'#a78bfa'}}>₦{totalProfit.toLocaleString()}</div><div style={{fontSize:10, opacity:0.7, marginTop:4}}>×10 Margin</div></div>
              <div style={{background:'rgba(255,255,255,0.06)', padding:20, borderRadius:16}}><div style={{color:'#9ca3af', fontSize:12}}>TOTAL COST (10%)</div><div style={{fontSize:28, fontWeight:800, marginTop:6, color:'#ef4444'}}>₦{totalCost.toLocaleString()}</div></div>
              <div style={{background:'rgba(255,255,255,0.06)', padding:20, borderRadius:16}}><div style={{color:'#9ca3af', fontSize:12}}>TOTAL IN WALLETS</div><div style={{fontSize:28, fontWeight:800, marginTop:6}}>₦{totalWalletBal.toLocaleString()}</div></div>
              <div style={{background:'rgba(255,255,255,0.06)', padding:20, borderRadius:16}}><div style={{color:'#9ca3af', fontSize:12}}>ORDERS / USERS</div><div style={{fontSize:28, fontWeight:800, marginTop:6}}>{orders.length} / {wallets.length}</div></div>
            </div>
          </>
        )}

        {activeTab==="orders" && (
          <div style={{marginTop:20, background:'rgba(255,255,255,0.05)', borderRadius:16, padding:20}}>
            <h3 style={{marginTop:0}}>📦 Orders — REAL ×10 Profit</h3>
            <div style={{display:'grid', gridTemplateColumns:'1fr 0.8fr 1fr 0.8fr', gap:8, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.2)', fontSize:11, opacity:0.5, fontWeight:700}}>
              <span>SERVICE</span><span>COUNTRY</span><span>SELLING</span><span>COST</span><span>PROFIT</span><span>STATUS</span>
            </div>
            {orders.map((o,i)=>{
              const cost = Math.round((o.price||0)/10);
              const profit = (o.price||0) - cost;
              return (
                <div key={i} style={{display:'grid', gridTemplateColumns:'1fr 0.8fr 1fr 0.8fr', gap:8, padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', fontSize:13}}>
                  <span>{o.service}</span>
                  <span>{o.country}</span>
                  <span style={{color:'#22c55e', fontWeight:700}}>₦{o.price}</span>
                  <span style={{color:'#ef4444', fontSize:12}}>₦{cost}</span>
                  <span style={{color:'#a78bfa', fontWeight:800}}>₦{profit}</span>
                  <span style={{fontSize:10,opacity:0.5}}>{o.status}</span>
                </div>
              )
            })}
          </div>
        )}

        {activeTab==="users" && (
          <div style={{marginTop:20, background:'rgba(255,255,255,0.05)', borderRadius:16, padding:20}}>
            <h3>👥 Wallets</h3>
            {wallets.map((w,i)=><div key={i} style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', fontSize:13}}><span>{w.user_id.slice(0,15)}...</span><span style={{color:'#22c55e', fontWeight:700}}>₦{Number(w.balance).toLocaleString()}</span></div>)}
          </div>
        )}

        {activeTab==="funding" && (
          <div style={{marginTop:20, background:'rgba(255,255,255,0.05)', borderRadius:16, padding:20}}>
            <h3>💳 Funding History</h3>
            {txs.map((t,i)=><div key={i} style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', fontSize:12}}><span>{new Date(t.created_at).toLocaleString()}</span><span style={{color:'#22c55e'}}>₦{t.amount}</span><span style={{opacity:0.6}}>{t.reference?.slice(0,15)}</span></div>)}
          </div>
        )}
      </div>
    </div>
  )
}
