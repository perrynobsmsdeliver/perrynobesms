"use client";
import { useState } from "react";

const BASE_PRICES: any = {
  whatsapp: 1500,
  telegram: 1700,
  tiktok: 1000,
  facebook: 1000,
  google: 1000,
  instagram: 1200,
  signal: 500,
};

const APPS = [
  { id: "whatsapp", name: "WhatsApp", icon: "💬" },
  { id: "telegram", name: "Telegram", icon: "✈️" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
  { id: "facebook", name: "Facebook", icon: "👍" },
  { id: "google", name: "Google / Gmail", icon: "G" },
  { id: "instagram", name: "Instagram", icon: "📸" },
  { id: "signal", name: "Signal", icon: "🔒" },
];

const COUNTRIES = [
  { id: "usa", name: "USA", flag: "🇺🇸", code: "+1", type: "usa" },
  { id: "canada", name: "Canada", flag: "🇨🇦", code: "+1", type: "canada" },
  { id: "uk", name: "UK", flag: "🇬🇧", code: "+44", type: "uk" },
  { id: "poland", name: "Poland", flag: "🇵🇱", code: "+48", type: "rest" },
  { id: "germany", name: "Germany", flag: "🇩🇪", code: "+49", type: "rest" },
  { id: "sweden", name: "Sweden", flag: "🇸🇪", code: "+46", type: "rest" },
  { id: "france", name: "France", flag: "🇫🇷", code: "+33", type: "rest" },
  { id: "netherlands", name: "Netherlands", flag: "🇳🇱", code: "+31", type: "rest" },
];

function getPrice(appId: string, countryType: string){
  const base = BASE_PRICES[appId] || 1000;
  if(countryType === "usa") return base;
  if(countryType === "canada") return base - 300;
  return base + 1000; // uk and rest
}

export default function Home(){
  const [selectedApp, setSelectedApp] = useState("whatsapp");
  const [selectedCountry, setSelectedCountry] = useState("usa");

  const countryObj = COUNTRIES.find(c=>c.id===selectedCountry);
  const finalPrice = getPrice(selectedApp, countryObj?.type || "usa");

  return (
    <div style={{minHeight:'100vh', background:'#f8fafc', fontFamily:'sans-serif'}}>
      <header style={{background:'black', color:'white', padding:'18px 20px', position:'sticky', top:0, zIndex:10}}>
        <div style={{maxWidth:900, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h1 style={{margin:0, fontSize:18, fontWeight:900}}>PerryNobe Virtual Numbers</h1>
          <span style={{fontSize:12, background:'#222', padding:'6px 10px', borderRadius:20}}>OTP - One Time</span>
        </div>
      </header>

      <div style={{maxWidth:900, margin:'0 auto', padding:20}}>

        <div style={{background:'white', borderRadius:16, padding:20, border:'1px solid #e5e7eb'}}>
          <h3 style={{margin:'0 0 12px 0'}}>1. Select App</h3>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:10}}>
            {APPS.map(app=>{
              const isActive = selectedApp===app.id;
              return (
                <div key={app.id} onClick={()=>setSelectedApp(app.id)}
                style={{border: isActive?'2px solid black':'1px solid #e5e7eb', borderRadius:12, padding:12, cursor:'pointer', background: isActive?'black':'white', color: isActive?'white':'black'}}>
                  <div style={{fontSize:18}}>{app.icon}</div>
                  <div style={{fontWeight:700, fontSize:13, marginTop:4}}>{app.name}</div>
                  <div style={{fontSize:11, opacity:0.7, marginTop:2}}>USA: ₦{BASE_PRICES[app.id].toLocaleString()}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{background:'white', borderRadius:16, padding:20, border:'1px solid #e5e7eb', marginTop:16}}>
          <h3 style={{margin:'0 0 12px 0'}}>2. Select Country</h3>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:10}}>
            {COUNTRIES.map(c=>{
              const isActive = selectedCountry===c.id;
              const price = getPrice(selectedApp, c.type);
              return (
                <div key={c.id} onClick={()=>setSelectedCountry(c.id)}
                style={{border: isActive?'2px solid black':'1px solid #e5e7eb', borderRadius:12, padding:12, cursor:'pointer', background: isActive?'#f0fdf4':'white'}}>
                  <div style={{fontSize:22}}>{c.flag}</div>
                  <div style={{fontWeight:700, fontSize:13}}>{c.name}</div>
                  <div style={{fontSize:11, opacity:0.6}}>{c.code}</div>
                  <div style={{fontWeight:900, color:'#059669', marginTop:4}}>₦{price.toLocaleString()}</div>
                  <div style={{fontSize:10, opacity:0.5}}>{c.type==='usa'?'Base': c.type==='canada'?'-₦300':' +₦1000'}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{background:'black', color:'white', borderRadius:16, padding:20, marginTop:20}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <div style={{fontSize:13, opacity:0.6}}>You Selected</div>
              <div style={{fontWeight:900, fontSize:18, marginTop:4}}>{APPS.find(a=>a.id===selectedApp)?.name} - {countryObj?.name} {countryObj?.flag}</div>
              <div style={{fontSize:12, opacity:0.6, marginTop:4}}>One-time OTP - Not Monthly - 15 mins valid</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:24, fontWeight:900}}>₦{finalPrice.toLocaleString()}</div>
            </div>
          </div>
          <button style={{width:'100%', marginTop:16, background:'white', color:'black', border:0, padding:16, borderRadius:12, fontWeight:900, fontSize:16}}>
            Buy Number Now
          </button>
          <div style={{fontSize:11, opacity:0.5, textAlign:'center', marginTop:10}}>
            Canada = USA - ₦300 | UK & Rest = USA + ₦1000
          </div>
        </div>

        <div style={{background:'white', borderRadius:16, padding:16, border:'1px solid #e5e7eb', marginTop:16}}>
          <h4 style={{margin:0}}>Your Formal Price Table</h4>
          <div style={{overflowX:'auto', marginTop:10}}>
            <table style={{width:'100%', fontSize:12, borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#f9fafb'}}><th style={{textAlign:'left', padding:8}}>App</th><th>USA</th><th>Canada</th><th>UK/Rest</th></tr></thead>
              <tbody>
                {APPS.map(app=>(
                  <tr key={app.id} style={{borderTop:'1px solid #f3f4f6'}}>
                    <td style={{padding:8, fontWeight:700}}>{app.name}</td>
                    <td style={{padding:8, textAlign:'center'}}>₦{BASE_PRICES[app.id]}</td>
                    <td style={{padding:8, textAlign:'center'}}>₦{BASE_PRICES[app.id]-300}</td>
                    <td style={{padding:8, textAlign:'center'}}>₦{BASE_PRICES[app.id]+1000}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
