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
  const [activeTab, setActiveTab] = useState("overview");

  const ADMIN_PASSWORD = "Perry2026";

  useEffect(()=>{
    if(!authed) return;
    const supabase = getSupabase()
    supabase.from("orders").select("*").order("created_at",{ascending:false}).limit(100).then(({data})=>{ if(data) setOrders(data) })
    supabase.from("wallets").select("*").order("balance",{ascending:false}).limit(100).then(({data})=>{ if(data) setWallets(data) })
  },[authed])

  const totalSales = orders.reduce((a,b)=>a+(b.price||0), 0);
  const totalCost = Math.round(totalSales * 0.45);
  const totalProfit = totalSales - totalCost;

  if (!authed) {
    return (
      <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#111827', padding:16, fontFamily:'sans-serif'}}>
        <div style={{background:'white', padding:32, borderRadius:16, width:'100%', maxWidth:380, textAlign:'center'}}>
          <div style={{fontSize:32}}>🔒</div>
          <h2 style={{margin:'12px 0 4px', color:'#111827'}}>Private Admin</h2>
          <p style={{color:'#6b7280', fontSize:14}}>Enter password to access REAL data</p>
          <input
            type="password"
            placeholder="Admin Password"
            value={pass}
            onChange={(e)=>setPass(e.target.value)}
            onKeyDown={(e)=>e.key==='Enter' && (pass===ADMIN_PASSWORD?setAuthed(true):null)}
            style={{width:'100%', padding:12, borderRadius:8, border:'1px solid #d1d5db', boxSizing:'border-box', marginTop:12, color:'#111'}}
          />
          <button onClick={()=>{if(pass===ADMIN_PASSWORD)setAuthed(true)}} style={{width:'100%', marginTop:12, background:'#111827', color:'white', padding:12, borderRadius:8, border:0, cursor:'pointer', fontWeight:700}}>Unlock Admin</button>
          <a href="/" style={{display:'block', marginTop:16, color:'#6b7280', fontSize:13, textDecoration:'none'}}>← Back to Website</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh', background:'#08080f', color:'white', fontFamily:'sans-serif'}}>
      <header style={{background:'#111827', padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <b>PerryNobeSMS - LIVE ADMIN</b>
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          <span style={{fontSize:11, background:'#065f46', padding:'6px 10px', borderRadius:20}}>LIVE MODE</span>
          <button onClick={()=>setAuthed(false)} style={{background:'#374151', color:'white', border:0, padding:'8px 12px', borderRadius:8, cursor:'pointer'}}>Logout</button>
        </div>
      </header>

      <div style={{padding:24, maxWidth:1150, margin:'0 auto'}}>
        <div style={{display:'flex', gap:8}}>
          {["overview","orders","users"].map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)} style={{ padding:"8px 16px", borderRadius:20, border:0, background: activeTab===t? "#7c3aed" : "rgba(255,255,255,0.1)", color:"white", cursor:"pointer", textTransform:"capitalize", fontWeight:600}}>{t}</button>
          ))}
        </div>

        {activeTab==="overview" && (
          <>
            <div style={{background:'#fef3c7', border:'1px solid #fcd34d', padding:12, borderRadius:10, fontSize:13, marginTop:20, color:'#92400e'}}>
              🔴 <b>REAL MODE:</b> This shows live Supabase data. Customer site shows 0% 5sim.
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:14, marginTop:20}}>
              <div style={{background:'rgba(255,255,255,0.06)', padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)'}}>
                <div style={{color:'#9ca3af', fontSize:12}}>TOTAL SALES</div>
                <div style={{fontSize:28, fontWeight:800, marginTop:6, color:'#22c55e'}}>₦{totalSales.toLocaleString()}</div>
              </div>
              <div style={{background:'rgba(124,58,237,0.18)', padding:20, borderRadius:16, border:'1px solid rgba(124,58,237,0.3)'}}>
                <div style={{color:'#a78bfa', fontSize:12}}>YOUR PROFIT EST.</div>
                <div style={{fontSize:28, fontWeight:800, marginTop:6, color:'#a78bfa'}}>₦{totalProfit.toLocaleString()}</div>
              </div>
              <div style={{background:'rgba(255,255,255,0.06)', padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)'}}>
                <div style={{color:'#9ca3af', fontSize:12}}>5SIM COST EST.</div>
                <div style={{fontSize:28, fontWeight:800, marginTop:6}}>₦{totalCost.toLocaleString()}</div>
              </div>
              <div style={{background:'rgba(255,255,255,0.06)', padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)'}}>
                <div style={{color:'#9ca3af', fontSize:12}}>TOTAL ORDERS</div>
                <div style={{fontSize:28, fontWeight:800, marginTop:6}}>{orders.length}</div>
              </div>
            </div>
          </>
        )}

        {activeTab==="orders" && (
          <div style={{marginTop:20, background:'rgba(255,255,255,0.05)', borderRadius:16, padding:20, border:'1px solid rgba(255,255,255,0.08)'}}>
            <h3 style={{marginTop:0}}>📦 Orders — REAL from Supabase</h3>
            {orders.length===0? <div style={{textAlign:'center', padding:32, color:'#6b7280'}}>No transactions yet.</div> :
              <div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, padding:'10px 0', fontSize:11, opacity:0.5, borderBottom:'1px solid rgba(255,255,255,0.1)'}}><span>SERVICE</span><span>COUNTRY</span><span>PRICE</span><span>NUMBER</span></div>
                {orders.map((o,i)=>(
                  <div key={i} style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', fontSize:13}}>
                    <span>{o.service}</span><span>{o.country}</span><span style={{color:'#22c55e'}}>₦{o.price}</span><span style={{opacity:0.7}}>{o.phone || "Waiting..."}</span>
                  </div>
                ))}
              </div>
            }
          </div>
        )}

        {activeTab==="users" && (
          <div style={{marginTop:20, background:'rgba(255,255,255,0.05)', borderRadius:16, padding:20, border:'1px solid rgba(255,255,255,0.08)'}}>
            <h3 style={{marginTop:0}}>👥 Users & Wallets — REAL</h3>
            {wallets.length===0? <div style={{color:'#6b7280'}}>No wallets yet</div> :
              wallets.map((w,i)=>(
                <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', fontSize:13}}>
                  <span style={{fontSize:11, opacity:0.7}}>{w.user_id.slice(0,12)}...</span>
                  <span style={{color:'#22c55e', fontWeight:700}}>₦{Number(w.balance).toLocaleString()}</span>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}
