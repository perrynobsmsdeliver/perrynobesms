"use client"
import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert(error.message)
    else {
      alert("Account created! Now login.")
      router.push("/login")
    }
    setLoading(false)
  }

  return (
    <div style={{maxWidth:400, margin:"80px auto", padding:20}}>
      <h1 style={{fontSize:28, fontWeight:"bold"}}>Create Account</h1>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:"100%", padding:12, marginTop:20, border:"1px solid #ddd", borderRadius:8}} />
      <input type="password" placeholder="Password (min 6)" value={password} onChange={e=>setPassword(e.target.value)} style={{width:"100%", padding:12, marginTop:12, border:"1px solid #ddd", borderRadius:8}} />
      <button onClick={handleSignup} disabled={loading} style={{width:"100%", padding:12, marginTop:20, background:"black", color:"white", borderRadius:8}}>
        {loading ? "Creating..." : "Sign Up"}
      </button>
      <p style={{marginTop:12}}>Have account? <a href="/login" style={{color:"blue"}}>Login</a></p>
    </div>
  )
}
