"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

//... keep your PRICE_MATRIX, FALLBACK, COUNTRIES, APPS, getPrice same as before...

export default function Home() {
  const [wallet, setWallet] = useState(0);
  const [showWallet, setShowWallet] = useState(false);
  const [selected, setSelected] = useState("whatsapp");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[6]);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [buying, setBuying] = useState(false);
  const router = useRouter()

  useEffect(()=>{
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if(!session){ router.push("/login"); return }
      setUser(session.user)
      const { data } = await supabase.from("wallets").select("balance").eq("user_id", session.user.id).single()
      if(data) setWallet(data.balance)
      else {
        await supabase.from("wallets").insert({ user_id: session.user.id, email: session.user.email, balance: 0 })
        setWallet(0)
      }
      setLoadingAuth(false)
    }
    init()
  },[])

  // REAL BUY - calls your backend /api/buy-number
  const handleBuy = async () => {
    if(wallet < finalPrice){ setShowWallet(true); return }
    setBuying(true)
    try {
      const res = await fetch("/api/buy-number", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          country: selectedCountry.c,
          service: selected,
          user_id: user.id,
          price: finalPrice
        })
      })
      const data = await res.json()
      if(!res.ok) throw new Error(data.error || "Failed")

      // Update local wallet from DB response
      const newBal = wallet - finalPrice
      setWallet(newBal)
      alert(`Success! Number: ${data.phone} - Check Orders page for OTP`)
      router.push("/orders")
    } catch(e:any) {
      alert("Buy failed: " + e.message)
    }
    setBuying(false)
  }

  const fundWithPaystack = async (amount: number) => {
    // REAL FUNDING - goes to Paystack
    const res = await fetch("/api/paystack/init", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ email: user.email, amount: amount * 100, user_id: user.id })
    })
    const data = await res.json()
    if(data.authorization_url){
      window.location.href = data.authorization_url
    } else {
      alert("Paystack error: " + JSON.stringify(data))
    }
  }

  const logout = async () => { await supabase.auth.signOut(); router.push("/login") }
  const finalPrice = getPrice(selected, selectedCountry.c);
  const filtered = COUNTRIES.filter(x=>x.n.toLowerCase().includes(search.toLowerCase()));
  if(loadingAuth) return <div style={{ minHeight:"100vh", background:"#08080f", color:"white", display:"flex", alignItems:"center", justifyContent:"center" }}>Loading...</div>

  return (
    <div style={{ minHeight:"100vh", background:"#08080f", color:"white" }}>
      {/* header same as yours */}
      <header style={{ display:"flex", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.1)", position:"sticky", top:0, background:"rgba(8,8,15,0.9)", backdropFilter:"blur(20px)", zIndex:10 }}>
        <b>🟣 PerryNobe • {user?.email}</b>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div onClick={()=>setShowWallet(true)} style={{ background:"rgba(255,255,255,0.1)", padding:"8px 16px", borderRadius:100, cursor:"pointer" }}>👛 <b style={{ color:"#22c55e" }}>₦{wallet.toLocaleString()}</b></div>
          <button onClick={logout} style={{ padding:"6px 12px", borderRadius:8, background:"rgba(255,255,255,0.1)", border:"1px solid #333", color:"white" }}>Logout</button>
        </div>
      </header>

      {/* your middle grid same - keep it */}

      {/* REAL WALLET POPUP - NO FAKE BUTTONS */}
      {showWallet && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"#15151f", maxWidth:360, width:"100%", borderRadius:20, padding:20, border:"1px solid rgba(255,255,255,0.1)" }}>
            <h3 style={{ margin:0 }}>Fund Wallet 👛</h3>
            <p style={{ fontSize:12, opacity:0.6 }}>{user?.email}</p>
            <div style={{ background:"black", borderRadius:14, padding:16, marginTop:12, textAlign:"center" }}><div style={{ fontSize:11, opacity:0.5 }}>Balance (Real DB)</div><div style={{ fontSize:28, fontWeight:900, color:"#22c55e" }}>₦{wallet.toLocaleString()}</div></div>

            <button onClick={()=>fundWithPaystack(5000)} style={{ width:"100%", marginTop:12, padding:14, borderRadius:12, background:"#22c55e", color:"black", border:0, fontWeight:900 }}>Fund ₦5,000 with Paystack</button>
            <button onClick={()=>fundWithPaystack(10000)} style={{ width:"100%", marginTop:8, padding:14, borderRadius:12, background:"white", color:"black", border:0, fontWeight:900 }}>Fund ₦10,000 with Paystack</button>
            <p style={{fontSize:10, opacity:0.4, marginTop:8, textAlign:"center"}}>Real money only. Paystack will add to your wallet after payment.</p>

            <button onClick={()=>setShowWallet(false)} style={{ width:"100%", marginTop:8, padding:10, background:"rgba(255,255,255,0.1)", border:"1px solid #333", borderRadius:10, color:"white" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
