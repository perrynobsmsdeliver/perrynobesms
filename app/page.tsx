"use client";
import { useState } from "react";

export default function Page() {
  const [showAuth, setShowAuth] = useState(false);
  return (
    <div>
      <header style={{background:'#111827', color:'white', padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <b style={{fontSize:20}}>PerryNobeSMS</b>
        <div style={{display:'flex', gap:12}}>
          <a href="/dashboard" style={{color:'white', textDecoration:'none', background:'#374151', padding:'8px 16px', borderRadius:8}}>Dashboard</a>
          <button onClick={()=>setShowAuth(true)} style={{background:'#2563eb', color:'white', border:0, padding:'8px 16px', borderRadius:8, cursor:'pointer'}}>Login</button>
        </div>
      </header>

      <section style={{padding:'48px 24px', textAlign:'center', background:'white'}}>
        <h1 style={{fontSize:36, margin:0}}>Bulk SMS, Airtime & Data in Naira</h1>
        <p style={{color:'#6b7280', maxWidth:600, margin:'16px auto'}}>Send bulk SMS from ₦3.50k. Buy MTN, Airtel, Glo, 9mobile airtime & data. Pay with Naira wallet.</p>
        <div style={{marginTop:24, display:'flex', gap:12, justifyContent:'center'}}>
          <a href="/dashboard" style={{background:'#111827', color:'white', padding:'12px 24px', borderRadius:10, textDecoration:'none'}}>Get Started Free</a>
          <a href="/admin" style={{background:'#e5e7eb', color:'#111827', padding:'12px 24px', borderRadius:10, textDecoration:'none'}}>Admin</a>
        </div>
      </section>

      <section style={{padding:'24px', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, maxWidth:1100, margin:'0 auto'}}>
        {[
          {t:'Bulk SMS', p:'From ₦3.50k / SMS', d:'DND & Non-DND routes. Delivery reports.'},
          {t:'Airtime VTU', p:'2% Discount', d:'MTN, Glo, Airtel, 9mobile instant.'},
          {t:'Data Bundles', p:'From ₦280', d:'All networks, 1GB - 100GB plans.'},
          {t:'Wallet (Naira)', p:'₦ Funding', d:'Paystack, Bank Transfer, Auto-credit.'},
        ].map((s,i)=>(
          <div key={i} style={{background:'white', padding:20, borderRadius:16, border:'1px solid #e5e7eb'}}>
            <b>{s.t}</b><div style={{color:'#2563eb', margin:'6px 0', fontWeight:700}}>{s.p}</div><div style={{color:'#6b7280', fontSize:14}}>{s.d}</div>
          </div>
        ))}
      </section>

      <section style={{background:'white', margin:'24px auto', maxWidth:1100, borderRadius:16, padding:24, border:'1px solid #e5e7eb'}}>
        <h3>Nigeria SMS Pricing (₦)</h3>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:12}}>
          <div style={{background:'#f3f4f6', padding:16, borderRadius:12}}><b>MTN</b><br/>₦3.80k / sms</div>
          <div style={{background:'#f3f4f6', padding:16, borderRadius:12}}><b>Airtel/Glo</b><br/>₦3.50k / sms</div>
          <div style={{background:'#f3f4f6', padding:16, borderRadius:12}}><b>9mobile</b><br/>₦3.90k / sms</div>
        </div>
      </section>

      <footer style={{textAlign:'center', padding:24, color:'#9ca3af'}}>© 2026 PerryNobeSMS - Lagos, Nigeria. Support: 081... (WhatsApp)</footer>

      {showAuth && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16}}>
          <div style={{background:'white', padding:24, borderRadius:16, width:'100%', maxWidth:360}}>
            <h3 style={{marginTop:0}}>Login / Signup</h3>
            <p style={{fontSize:14, color:'#6b7280'}}>Demo mode - Click continue to enter dashboard with ₦5,000 bonus wallet.</p>
            <input placeholder="Email" style={{width:'100%', padding:10, margin:'8px 0', borderRadius:8, border:'1px solid #d1d5db', boxSizing:'border-box'}}/>
            <input placeholder="Password" type="password" style={{width:'100%', padding:10, margin:'8px 0', borderRadius:8, border:'1px solid #d1d5db', boxSizing:'border-box'}}/>
            <a href="/dashboard" style={{display:'block', textAlign:'center', background:'#111827', color:'white', padding:12, borderRadius:8, textDecoration:'none', marginTop:12}}>Continue to Dashboard</a>
            <button onClick={()=>setShowAuth(false)} style={{width:'100%', marginTop:8, background:'transparent', border:0, color:'#6b7280'}}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
