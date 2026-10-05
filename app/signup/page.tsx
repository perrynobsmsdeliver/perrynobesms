"use client"
import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}
const supabase = getSupabase() as any

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"signup" | "code">("signup")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async () => {
    if(!supabase) return alert("Supabase not configured - add NEXT_PUBLIC_ envs in Vercel")
    if(!email || password.length < 6) return alert("Enter valid email and password min 6")
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error){ setLoading(false); return alert(error.message) }

    // send 6-digit code
    const { error: otpError } = await supabase.auth.signInWithOtp({ email, options:{ shouldCreateUser:false } })
    setLoading(false)
    if(otpError) alert(otpError.message)
    else { 
      setStep("code")
      alert("Account created! 6-digit code sent to your mail") 
    }
  }

  const verifyCode = async () => {
    if(code.length !== 6) return alert("Code must be exactly 6 digits")
    setLoading(true)
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" })
    if(error){ setLoading(false); return alert(error.message) }
    
    await supabase.from("wallets").upsert({ user_id: data.user?.id, balance:0 }, {onConflict:"user_id"})
    setLoading(false)
    router.push("/")
  }

  return (
    <div style={{minHeight:"100vh",background:"#08080f",color:"white",display:"grid",placeItems:"center",padding:16}}>
      <div style={{background:"#12121f",border:"1px solid #232334",borderRadius:20,padding:24,width:"100%",maxWidth:360}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#7c3aed,#22c55e)",display:"grid",placeItems:"center",fontWeight:900}}>⚡</div>
          <h2 style={{fontWeight:900,fontSize:20,margin:0}}>perryotp</h2>
        </div>
        <p style={{fontSize:12,opacity:0.5,marginBottom:20}}>{step==="signup" ? "Create new account" : "Enter 6-digit code from mail"}</p>

        {step==="signup" ? <>
          <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:"100%",padding:14,borderRadius:12,background:"#08080f",border:"1px solid #2a2a3a",color:"white",marginBottom:10}}/>
          <input type="password" placeholder="Password (min 6)" value={password} onChange={e=>setPassword(e.target.value)} style={{width:"100%",padding:14,borderRadius:12,background:"#08080f",border:"1px solid #2a2a3a",color:"white"}}/>
          <button onClick={handleSignup} disabled={loading} style={{width:"100%",padding:14,marginTop:14,background:"#7c3aed",color:"white",borderRadius:12,fontWeight:900}}>
            {loading ? "Creating..." : "Sign Up"}
          </button>
          <p style={{marginTop:12,fontSize:12,textAlign:"center",opacity:0.5}}>Have account? <a href="/login" style={{color:"#7c3aed"}}>Login</a></p>
        </> : <>
          <input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="6-digit code" maxLength={6} inputMode="numeric" style={{width:"100%",padding:14,borderRadius:12,background:"#08080f",border:"1px solid #2a2a3a",color:"white",textAlign:"center",letterSpacing:6,fontSize:18}}/>
          <button onClick={verifyCode} disabled={loading} style={{width:"100%",padding:14,marginTop:14,background:"#22c55e",color:"black",borderRadius:12,fontWeight:900}}>
            {loading ? "Verifying..." : "Verify & Create Account"}
          </button>
        </>}
      </div>
    </div>
  )
}
