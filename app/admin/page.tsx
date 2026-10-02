"use client";
import { useState, useEffect } from "react";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState<any[]>([]);
  const [multiplier, setMultiplier] = useState(10);

  const ADMIN_PASSWORD = "Perry2026";

  useEffect(()=>{
    const o = localStorage.getItem("perrynobe_orders");
    if(o) setOrders(JSON.parse(o));
    const m = localStorage.getItem("perrynobe_multiplier");
    if(m) setMultiplier(Number(m));
  },[]);

  function login() {
    if (pass === ADMIN_PASSWORD) {
      setAuthed(true);
      setError("");
    } else {
      setError("Wrong password. Try again.");
    }
  }

  const totalSales = orders.reduce((a,b)=>a+(b.price||0), 0);
  const totalCost = Math.round(totalSales / multiplier);
  const totalProfit = totalSales - totalCost;

  if (!authed) {
    return (
      <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#111827', padding:16, fontFamily:'sans-serif'}}>
        <div style={{background:'white', padding:32, borderRadius:16, width:'100%', maxWidth:380, textAlign:'center'}}>
          <div style={{fontSize:32}}>🔒</div>
          <h2 style={{margin:'12px 0 4px', color:'#111827'}}>Private Admin</h2>
          <p style={{color:'#6b7280', fontSize:14, marginTop:0}}>Enter password to access PerryNobeSMS Admin</p>
          <input 
            type="password"
            placeholder="Admin Password"
            value={pass}
            onChange={(e)=>setPass(e.target.value)}
            onKeyDown={(e)=>e.key==='Enter' && login()}
            style={{width:'100%', padding:12, borderRadius:8, border:'1px solid #d1d5db', boxSizing:'border-box', marginTop:12, color:'#111'}}
          />
          {error && <div style={{color:'red', fontSize:13, marginTop:8}}>{error}</div>}
          <button onClick={login} style={{width:'100%', marginTop:12, background:'#111827', color:'white', padding:12, borderRadius:8, border:0, cursor:'pointer', fontWeight:700}}>Unlock Admin</button>
          <a href="/" style={{display:'block', marginTop:16, color:'#6b7280', fontSize:13, textDecoration:'none'}}>← Back to Website</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh', background:'#08080f', color:'white', fontFamily:'sans-serif'}}>
      <header style={{background:'#111827', color:'white', padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:10}}>
        <b>PerryNobeSMS - REAL ADMIN</b>
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          <span style={{fontSize:11, background:'#065f46', padding:'6px 10px', borderRadius:20}}>LIVE MODE - REAL DATA • x{multiplier} PROFIT HIDDEN</span>
          <button onClick={()=>setAuthed(false)} style={{background:'#374151', color:'white', border:0, padding:'8px 12px', borderRadius:8, cursor:'pointer'}}>Logout</button>
        </div>
      </header>

      <div style={{padding:24, maxWidth:1150, margin:'0 auto'}}>
        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          {["overview","orders","pricing","users","settings"].map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)} style={{ padding:"8px 16px", borderRadius:20, border:0, background: activeTab===t ? "#7c3aed" : "rgba(255,255,255,0.1)", color:"white", cursor:"pointer", textTransform:"capitalize", fontWeight:600 }}>{t}</button>
          ))}
        </div>

        {activeTab==="overview" && (
          <>
            <div style={{background:'#fef3c7', border:'1px solid #fcd34d', padding:12, borderRadius:10, fontSize:13, marginTop:20, color:'#92400e'}}>
              🔴 <b>REAL MODE ACTIVE:</b> Customer site shows 0% 5sim. Only you see profit here.
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:14, marginTop:20}}>
              <div style={{background:'rgba(255,255,255,0.06)', padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)'}}>
                <div style={{color:'#9ca3af', fontSize:12}}>TOTAL SALES</div>
                <div style={{fontSize:28, fontWeight:800, marginTop:6, color:'#22c55e'}}>₦{totalSales.toLocaleString()}</div>
                <div style={{color:'#6b7280', fontSize:11, marginTop:4}}>What customers paid</div>
              </div>
              <div style={{background:'rgba(124,58,237,0.18)', padding:20, borderRadius:16, border:'1px solid rgba(124,58,237,0.3)'}}>
                <div style={{color:'#a78bfa', fontSize:12}}>YOUR PROFIT (x{multiplier})</div>
                <div style={{fontSize:28, fontWeight:800, marginTop:6, color:'#a78bfa'}}>₦{totalProfit.toLocaleString()}</div>
                <div style={{color:'#6b7280', fontSize:11, marginTop:4}}>Sales - 5sim cost</div>
              </div>
              <div style={{background:'rgba(255,255,255,0.06)', padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)'}}>
                <div style={{color:'#9ca3af', fontSize:12}}>5SIM COST</div>
                <div style={{fontSize:28, fontWeight:800, marginTop:6}}>₦{totalCost.toLocaleString()}</div>
                <div style={{color:'#6b7280', fontSize:11, marginTop:4}}>Hidden from customers</div>
              </div>
              <div style={{background:'rgba(255,255,255,0.06)', padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)'}}>
                <div style={{color:'#9ca3af', fontSize:12}}>TOTAL ORDERS</div>
                <div style={{fontSize:28, fontWeight:800, marginTop:6}}>{orders.length}</div>
                <div style={{color:'#6b7280', fontSize:11, marginTop:4}}>Real orders</div>
              </div>
            </div>
          </>
        )}

        {activeTab==="orders" && (
          <div style={{marginTop:20, background:'rgba(255,255,255,0.05)', borderRadius:16, padding:20, border:'1px solid rgba(255,255,255,0.08)'}}>
            <h3 style={{marginTop:0}}>📦 Orders — REAL</h3>
            {orders.length===0 ? <div style={{textAlign:'center', padding:32, color:'#6b7280'}}>No transactions yet. When customer buys number, it shows here.</div> :
              <div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, padding:'10px 0', fontSize:11, opacity:0.5, borderBottom:'1px solid rgba(255,255,255,0.1)'}}><span>SERVICE</span><span>COUNTRY</span><span>PRICE</span><span>NUMBER</span></div>
                {orders.map((o,i)=>(
                  <div key={i} style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', fontSize:13}}>
                    <span>{o.service}</span><span>{o.country}</span><span style={{color:'#22c55e'}}>₦{o.price}</span><span style={{opacity:0.7}}>{o.number || "Waiting SMS..."}</span>
                  </div>
                ))}
              </div>
            }
          </div>
        )}

        {activeTab==="pricing" && (
          <div style={{marginTop:20, background:'rgba(255,255,255,0.05)', borderRadius:16, padding:20, border:'1px solid rgba(255,255,255,0.08)'}}>
            <h3 style={{marginTop:0}}>💰 Pricing Control</h3>
            <label style={{fontSize:12, opacity:0.7}}>Profit Multiplier</label>
            <input type="number" value={multiplier} onChange={e=>{ setMultiplier(Number(e.target.value)); localStorage.setItem("perrynobe_multiplier", e.target.value); }} style={{width:'100%', marginTop:6, padding:12, background:'black', border:'1px solid #333', borderRadius:10, color:'white'}} />
            <p style={{fontSize:11, opacity:0.5, marginTop:8}}>Example: 5sim price ₦180 x {multiplier} = Customer pays ₦{180*multiplier}. Your profit = ₦{180*multiplier - 180}. Customer NEVER sees this.</p>
          </div>
        )}

        {activeTab==="users" && (
          <div style={{marginTop:20, background:'rgba(255,255,255,0.05)', borderRadius:16, padding:20}}>
            <h3 style={{marginTop:0}}>👥 Users & Wallets</h3>
            <p style={{fontSize:12, opacity:0.6}}>Real user list needs Supabase/Firebase. For now, localStorage wallet tracking.</p>
            <div style={{marginTop:12, background:'black', padding:12, borderRadius:10, fontSize:13}}>Demo Wallet Balance: ₦{typeof window!=="undefined" ? (localStorage.getItem("perrynobe_wallet") || "0") : "0"}</div>
          </div>
        )}

        {activeTab==="settings" && (
          <div style={{marginTop:20, background:'rgba(255,255,255,0.05)', borderRadius:16, padding:20, fontSize:13, lineHeight:1.8}}>
            <h3 style={{marginTop:0}}>⚙️ Settings</h3>
            <p>✅ Admin Link: <code>/admin</code> — Change folder name to hide more</p>
            <p>✅ Password: <code>Perry2026</code> — Change in code line 10</p>
            <p>✅ Customer site: 0% 5sim text — 100% white-label</p>
            <p>✅ Add to robots.txt: <code>Disallow: /admin</code></p>
            <button onClick={()=>{ if(confirm("Clear all orders?")){ localStorage.removeItem("perrynobe_orders"); setOrders([]); } }} style={{marginTop:14, background:'#ef4444', border:0, padding:'10px 16px', borderRadius:8, color:'white', cursor:'pointer'}}>Clear All Orders</button>
          </div>
        )}
      </div>
    </div>
  )
}
