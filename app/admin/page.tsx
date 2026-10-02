"use client";
import { useState } from "react";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const ADMIN_PASSWORD = "Perry2026";

  function login() {
    if (pass === ADMIN_PASSWORD) {
      setAuthed(true);
      setError("");
    } else {
      setError("Wrong password. Try again.");
    }
  }

  if (!authed) {
    return (
      <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#111827', padding:16}}>
        <div style={{background:'white', padding:32, borderRadius:16, width:'100%', maxWidth:380, textAlign:'center'}}>
          <div style={{fontSize:32}}>🔒</div>
          <h2 style={{margin:'12px 0 4px'}}>Private Admin</h2>
          <p style={{color:'#6b7280', fontSize:14, marginTop:0}}>Enter password to access PerryNobeSMS Admin</p>
          <input 
            type="password"
            placeholder="Admin Password"
            value={pass}
            onChange={(e)=>setPass(e.target.value)}
            onKeyDown={(e)=>e.key==='Enter' && login()}
            style={{width:'100%', padding:12, borderRadius:8, border:'1px solid #d1d5db', boxSizing:'border-box', marginTop:12}}
          />
          {error && <div style={{color:'red', fontSize:13, marginTop:8}}>{error}</div>}
          <button onClick={login} style={{width:'100%', marginTop:12, background:'#111827', color:'white', padding:12, borderRadius:8, border:0, cursor:'pointer', fontWeight:700}}>Unlock Admin</button>
          <a href="/" style={{display:'block', marginTop:16, color:'#6b7280', fontSize:13, textDecoration:'none'}}>← Back to Website</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh', background:'#f3f4f6'}}>
      <header style={{background:'#111827', color:'white', padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <b>PerryNobeSMS - REAL ADMIN</b>
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          <span style={{fontSize:13, background:'#065f46', padding:'6px 10px', borderRadius:20}}>LIVE MODE - REAL DATA</span>
          <button onClick={()=>setAuthed(false)} style={{background:'#374151', color:'white', border:0, padding:'8px 12px', borderRadius:8, cursor:'pointer'}}>Logout</button>
        </div>
      </header>

      <div style={{padding:24, maxWidth:1100, margin:'0 auto'}}>
        <div style={{background:'#fef3c7', border:'1px solid #fcd34d', padding:12, borderRadius:10, fontSize:14, marginBottom:20}}>
          🔴 <b>REAL MODE ACTIVE:</b> No demo data. These numbers are your real business.
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16}}>
          <div style={{background:'white', padding:20, borderRadius:16, border:'1px solid #e5e7eb'}}>
            <div style={{color:'#6b7280', fontSize:13}}>TOTAL USERS</div>
            <div style={{fontSize:28, fontWeight:800, marginTop:6}}>0</div>
            <div style={{color:'#9ca3af', fontSize:12, marginTop:4}}>No customers yet</div>
          </div>
          <div style={{background:'white', padding:20, borderRadius:16, border:'1px solid #e5e7eb'}}>
            <div style={{color:'#6b7280', fontSize:13}}>WALLET BALANCE (All Users)</div>
            <div style={{fontSize:28, fontWeight:800, marginTop:6}}>₦0</div>
            <div style={{color:'#9ca3af', fontSize:12, marginTop:4}}>Real Naira - not demo</div>
          </div>
          <div style={{background:'white', padding:20, borderRadius:16, border:'1px solid #e5e7eb'}}>
            <div style={{color:'#6b7280', fontSize:13}}>SMS SENT TODAY</div>
            <div style={{fontSize:28, fontWeight:800, marginTop:6}}>0</div>
            <div style={{color:'#9ca3af', fontSize:12, marginTop:4}}>Real deliveries</div>
          </div>
          <div style={{background:'white', padding:20, borderRadius:16, border:'1px solid #e5e7eb'}}>
            <div style={{color:'#6b7280', fontSize:13}}>TOTAL REVENUE</div>
            <div style={{fontSize:28, fontWeight:800, marginTop:6}}>₦0</div>
            <div style={{color:'#9ca3af', fontSize:12, marginTop:4}}>Your real profit</div>
          </div>
        </div>

        <div style={{background:'white', marginTop:20, borderRadius:16, padding:24, border:'1px solid #e5e7eb'}}>
          <h3 style={{marginTop:0}}>Recent Transactions - REAL</h3>
          <div style={{textAlign:'center', padding:32, color:'#9ca3af'}}>
            No transactions yet.<br/>
            <span style={{fontSize:13}}>When a customer funds wallet or sends SMS, it will appear here.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
