"use client";
import { useState } from "react";

const BASE_PRICES: any = {
  whatsapp: 1500, telegram: 1700, tiktok: 1000, facebook: 1000,
  google: 1000, instagram: 1200, signal: 500,
};

const APPS = [
  { id: "whatsapp", name: "WhatsApp", icon: "💬" },
  { id: "telegram", name: "Telegram", icon: "✈️" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
  { id: "facebook", name: "Facebook", icon: "👍" },
  { id: "google", name: "Google", icon: "G" },
  { id: "instagram", name: "Instagram", icon: "📸" },
  { id: "signal", name: "Signal", icon: "🔒" },
];

const COUNTRIES = [
  { id: "usa", name: "USA", flag: "🇺🇸", type: "usa" },
  { id: "canada", name: "Canada", flag: "🇨🇦", type: "canada" },
  { id: "uk", name: "UK", flag: "🇬🇧", type: "uk" },
  { id: "poland", name: "Poland", flag: "🇵🇱", type: "rest" },
  { id: "germany", name: "Germany", flag: "🇩🇪", type: "rest" },
];

function getPrice(appId: string, countryType: string){
  const base = BASE_PRICES[appId] || 1000;
  if(countryType === "usa") return base;
  if(countryType === "canada") return base - 300;
  return base + 1000;
}

export default function Home(){
  const [walletBalance, setWalletBalance] = useState(2500); // Demo balance
  const [showWallet, setShowWallet] = useState(false);
  const [selectedApp, setSelectedApp] = useState("whatsapp");
  const [selectedCountry, setSelectedCountry] = useState("usa");

  const countryObj = COUNTRIES.find(c=>c.id===selectedCountry);
  const finalPrice = getPrice(selectedApp, countryObj?.type || "usa");

  const handleBuy = () => {
    if(walletBalance < finalPrice){
      alert(`Insufficient wallet! You have ₦${walletBalance} but need ₦${finalPrice}. Please fund wallet.`);
      setShowWallet(true);
      return;
    }
    setWalletBalance(walletBalance - finalPrice);
    alert(`Success! Number purchased. ₦${finalPrice} deducted from wallet. New balance: ₦${walletBalance - finalPrice}`);
  };

  return (
    <div style={{minHeight:'100vh', background:'#f8fafc', fontFamily:'sans-serif'}}>
      {/* HEADER WITH WALLET ICON */}
      <header style={{background:'black', color:'white', padding:'14px 20px', position:'sticky', top:0, zIndex:20}}>
        <div style={{maxWidth:900, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h1 style={{margin:0, fontSize:16, fontWeight:900}}>PerryNobe</h1>

          <div style={{display:'flex', gap:12, alignItems:'center'}}>
            {/* WALLET BALANCE ICON - AS YOU REQUESTED */}
            <div onClick={()=>setShowWallet(true)} style={{background:'#222', border:'1px solid #333', padding:'8px 14px', borderRadius:30, display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}>
              <span style={{fontSize:16}}>👛</span>
              <div>
                <div style={{fontSize:10, opacity:0.6, lineHeight:1}}>WALLET</div>
                <div style={{fontSize:13, fontWeight:900, color:'#22c55e'}}>₦{walletBalance.toLocaleString()}</div>
              </div>
            </div>

            <div style={{width:32, height:32, background:'white', color:'black', borderRadius:50, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900}}>P</div>
          </div>
        </div>
      </header>

      {/* WALLET MODAL */}
      {showWallet && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>
          <div style={{background:'white', width:'100%', maxWidth:380, borderRadius:20, padding:24}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h3 style={{margin:0}}>My Wallet 👛</h3>
              <span onClick={()=>setShowWallet(false)} style={{cursor:'pointer', background:'#f3f4f6', padding:'6px 10px', borderRadius:20}}>✕</span>
            </div>

            <div style={{background:'black', color:'white', borderRadius:16, padding:18, marginTop:16, textAlign:'center'}}>
              <div style={{fontSize:12, opacity:0.6}}>CURRENT BALANCE</div>
              <div style={{fontSize:32, fontWeight:900, color:'#22c55e', marginTop:4}}>₦{walletBalance.toLocaleString()}</div>
              <div style={{fontSize:11, opacity:0.5, marginTop:8}}>Fund wallet first, then use to buy numbers</div>
            </div>

            <div style={{marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
              {[1000, 2500, 5000].map(amt=>(
                <button key={amt} onClick={()=>setWalletBalance(walletBalance+amt)} style={{padding:12, borderRadius:12, border:'1px solid #e5e7eb', background:'white', fontWeight:700}}> +₦{amt.toLocaleString()} </button>
              ))}
            </div>

            <button onClick={()=>{setWalletBalance(walletBalance+1000);}} style={{width:'100%', marginTop:12, background:'#22c55e', color:'white', border:0, padding:14, borderRadius:12, fontWeight:900}}>
              Fund Wallet via Paystack
            </button>

            <div style={{fontSize:11, opacity:0.6, textAlign:'center', marginTop:10}}>
              Demo: Click amount to add to wallet. Real Paystack integration next.
            </div>
          </div>
        </div>
      )}

      <div style={{maxWidth:900, margin:'0 auto', padding:20}}>
        <div style={{background:'white', borderRadius:16, padding:20, border:'1px solid #e5e7eb'}}>
          <h3 style={{margin:'0 0 12px 0'}}>1. Select App</h3>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:10}}>
            {APPS.map(app=>{
              const isActive = selectedApp===app.id;
              return (
                <div key={app.id} onClick={()=>setSelectedApp(app.id)}
                style={{border: isActive?'2px solid black':'1px solid #e5e7eb', borderRadius:12, padding:12, cursor:'pointer', background: isActive?'black':'white', color: isActive?'white':'black'}}>
                  <div>{app.icon} {app.name}</div>
                  <div style={{fontSize:11, marginTop:4}}>USA ₦{BASE_PRICES[app.id]}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{background:'white', borderRadius:16, padding:20, border:'1px solid #e5e7eb', marginTop:16}}>
          <h3 style={{margin:'0 0 12px 0'}}>2. Select Country</h3>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:10}}>
            {COUNTRIES.map(c=>{
              const isActive = selectedCountry===c.id;
              const price = getPrice(selectedApp, c.type);
              return (
                <div key={c.id} onClick={()=>setSelectedCountry(c.id)}
                style={{border: isActive?'2px solid black':'1px solid #e5e7eb', borderRadius:12, padding:12, cursor:'pointer', background: isActive?'#f0fdf4':'white'}}>
                  <div>{c.flag} {c.name}</div>
                  <div style={{fontWeight:900, color:'#059669', marginTop:4}}>₦{price.toLocaleString()}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{background:'black', color:'white', borderRadius:16, padding:20, marginTop:20}}>
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:12, opacity:0.6}}>Will pay from wallet</div>
              <div style={{fontWeight:900, fontSize:16}}>{APPS.find(a=>a.id===selectedApp)?.name} - {countryObj?.name}</div>
            </div>
            <div style={{fontSize:22, fontWeight:900}}>₦{finalPrice.toLocaleString()}</div>
          </div>
          <button onClick={handleBuy} style={{width:'100%', marginTop:14, background:'white', color:'black', border:0, padding:16, borderRadius:12, fontWeight:900}}>
            Buy with Wallet Balance 👛
          </button>
          <div style={{fontSize:11, opacity:0.5, textAlign:'center', marginTop:8}}>Money will be deducted from your wallet 👛 icon at top</div>
        </div>
      </div>
    </div>
  )
}
