"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
const supabase = getSupabase() as any;

export default function Login(){
  const [email,setEmail]=useState(""); 
  const [pass,setPass]=useState("");
  const [otp,setOtp]=useState("");
  const [isLogin,setIsLogin]=useState(true); 
  const [step,setStep]=useState("auth");
  const [loading,setLoading]=useState(false);
  const router=useRouter();

  const submit=async()=>{
    if(!supabase) return alert("Supabase not configured - check Vercel envs");
    setLoading(true);
    if(isLogin){
      const {error}=await supabase.auth.signInWithPassword({email,password:pass});
      setLoading(false);
      if(error) {
        if(error.message.includes("Email not confirmed")){
          await supabase.auth.resend({ type: 'signup', email });
          alert("Email not confirmed! We sent new CODE to " + email);
          setStep("otp");
        } else {
          alert(error.message);
        }
      } else router.push("/"); // FIXED: was /dashboard
    }else{
      const {error}=await supabase.auth.signUp({email,password:pass});
      setLoading(false);
      if(error) alert(error.message); 
      else { 
        alert("CODE SENT to " + email);
        setStep("otp"); 
      }
    }
  };

  const verifyCode = async()=>{
    if(!supabase) return;
    setLoading(true);
    const {error} = await supabase.auth.verifyOtp({ email, token: otp, type: "signup" });
    setLoading(false);
    if(error) alert("Wrong code! " + error.message);
    else {
      alert("Verified! Welcome!");
      router.push("/"); // FIXED: was /dashboard
    }
  }

  return(
    <div style={{ minHeight:"100vh", background:"#08080f", display:"flex", alignItems:"center", justifyContent:"center", padding:20, color:"white" }}>
      <div style={{ background:"#15151f", padding:30, borderRadius:20, width:"100%", maxWidth:360, border:"1px solid #333" }}>
        {step==="auth" ? (
          <>
            <h2>🟣 PerryNobe {isLogin?"Login":"Sign Up"}</h2>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" style={{ width:"100%", padding:12, marginTop:12, borderRadius:10, background:"black", border:"1px solid #333", color:"white" }}/>
            <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password" type="password" style={{ width:"100%", padding:12, marginTop:10, borderRadius:10, background:"black", border:"1px solid #333", color:"white" }}/>
            <button onClick={submit} disabled={loading} style={{ width:"100%", padding:14, marginTop:14, borderRadius:10, background:"linear-gradient(90deg,#7c3aed,#4f46e5)", border:0, color:"white", fontWeight:900 }}>
              {loading?"Wait...":isLogin?"Login":"Create Account & Send Code"}
            </button>
            <p onClick={()=>setIsLogin(!isLogin)} style={{ textAlign:"center", marginTop:12, fontSize:12, opacity:0.6, cursor:"pointer" }}>{isLogin?"No account? Sign Up":"Have account? Login"}</p>
          </>
        ) : (
          <>
            <h2>✉️ Enter Code</h2>
            <p style={{ fontSize:12, opacity:0.6, marginTop:8 }}>Code sent to <b style={{color:"white"}}>{email}</b></p>
            <input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="123456" style={{ width:"100%", padding:15, marginTop:14, borderRadius:10, background:"black", border:"1px solid #333", color:"white", fontSize:20, letterSpacing:5, textAlign:"center" }}/>
            <button onClick={verifyCode} disabled={loading} style={{ width:"100%", padding:14, marginTop:14, borderRadius:10, background:"#22c55e", border:0, color:"black", fontWeight:900 }}>
              {loading?"Verifying...":"Verify Code & Enter"}
            </button>
            <p onClick={async()=>{ await supabase.auth.resend({type:'signup', email}); alert("New code sent!"); }} style={{ textAlign:"center", marginTop:12, fontSize:12, color:"#7c3aed", cursor:"pointer" }}>Resend Code</p>
            <p onClick={()=>setStep("auth")} style={{ textAlign:"center", marginTop:8, fontSize:12, opacity:0.6, cursor:"pointer" }}>Go Back</p>
          </>
        )}
      </div>
    </div>
  )
}
