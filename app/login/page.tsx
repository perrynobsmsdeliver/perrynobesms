"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function LoginPage() {
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"login" | "code" | "forgot" | "reset">("login"); 
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePasswordLogin = async () => {
    if(!email || !password) return alert("Enter email and password");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if(error){ setLoading(false); return alert(error.message); }
    const { error: otpError } = await supabase.auth.signInWithOtp({ email, options:{ shouldCreateUser:false } });
    setLoading(false);
    if(otpError) alert(otpError.message); 
    else setStep("code");
  };

  const verifyCode = async () => {
    if(code.length !== 6) return alert("Code must be 6 digits");
    setLoading(true);
    const { error, data } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    setLoading(false);
    if(error) alert(error.message);
    else { 
      const { data: existing } = await supabase.from("wallets").select("id").eq("user_id", data.user?.id).single();
      if (!existing) {
        await supabase.from("wallets").insert({ user_id: data.user?.id, balance: 0 });
      }
      router.push("/"); 
    }
  };

  const sendResetCode = async () => {
    if(!email) return alert("Enter your email");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options:{ shouldCreateUser:false } });
    setLoading(false);
    if(error) alert(error.message);
    else { setStep("reset"); alert("6-digit reset code sent to your mail"); }
  };

  const handleResetPassword = async () => {
    if(code.length !== 6) return alert("Code must be 6 digits");
    if(password.length < 6) return alert("New password must be 6+ chars");
    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if(verifyError){ setLoading(false); return alert(verifyError.message); }
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if(error) alert(error.message);
    else { alert("Password reset! Login now"); setStep("login"); setPassword(""); setCode(""); }
  };

  return (
    <div style={{minHeight:"100vh",background:"#08080f",color:"white",display:"grid",placeItems:"center",padding:16}}>
      <div style={{background:"#12121f",border:"1px solid #232334",borderRadius:20,padding:24,width:"100%",maxWidth:360}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#7c3aed,#22c55e)",display:"grid",placeItems:"center",fontWeight:900}}>⚡</div>
          <h2 style={{fontWeight:900,fontSize:20,margin:0}}>perryotp</h2>
        </div>

        <div style={{display:"flex", gap:6, marginBottom:18, background:"#08080f", padding:4, borderRadius:12, border:"1px solid #232334"}}>
          <div style={{flex:1, padding:"8px", textAlign:"center", borderRadius:8, background:"#7c3aed", color:"white", fontSize:13, fontWeight:700}}>Login</div>
          <a href="/signup" style={{flex:1, padding:"8px", textAlign:"center", borderRadius:8, background:"transparent", color:"rgba(255,255,255,0.6)", fontSize:13, fontWeight:700, textDecoration:"none"}}>Sign Up</a>
        </div>

        <p style={{fontSize:12,opacity:0.5,marginBottom:20}}>
          {step==="login" && "Login with email & password"}
          {step==="code" && "Enter 6-digit code from your mail"}
          {step==="forgot" && "Reset password"}
          {step==="reset" && "Enter 6-digit code + new password"}
        </p>

        {step==="login" && <>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter email" style={{width:"100%",padding:14,borderRadius:12,background:"#08080f",border:"1px solid #2a2a3a",color:"white",marginBottom:10}}/>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" style={{width:"100%",padding:14,borderRadius:12,background:"#08080f",border:"1px solid #2a2a3a",color:"white"}}/>
          <button onClick={handlePasswordLogin} disabled={loading} style={{width:"100%",marginTop:12,padding:14,borderRadius:12,background:"#7c3aed",color:"white",fontWeight:900}}>{loading?"Checking...":"Login"}</button>
          <button onClick={()=>setStep("forgot")} style={{width:"100%",marginTop:10,background:"transparent",border:0,color:"#7c3aed",fontSize:12}}>Forgot password? Send 6-digit code</button>
          <p style={{fontSize:13, textAlign:"center", marginTop:16, color:"rgba(255,255,255,0.5)"}}>
            Don't have account? <a href="/signup" style={{color:"#22c55e", fontWeight:700, textDecoration:"none"}}>Create account</a>
          </p>
        </>}

        {step==="code" && <>
          <input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="6-digit code" maxLength={6} inputMode="numeric" style={{width:"100%",padding:14,borderRadius:12,background:"#08080f",border:"1px solid #2a2a3a",color:"white",textAlign:"center",letterSpacing:6,fontSize:18}}/>
          <button onClick={verifyCode} disabled={loading} style={{width:"100%",marginTop:12,padding:14,borderRadius:12,background:"#22c55e",color:"black",fontWeight:900}}>{loading?"Verifying...":"Verify & Login"}</button>
          <button onClick={()=>setStep("login")} style={{width:"100%",marginTop:10,background:"transparent",border:0,color:"white",opacity:0.4,fontSize:12}}>Back to login</button>
        </>}

        {step==="forgot" && <>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter email" style={{width:"100%",padding:14,borderRadius:12,background:"#08080f",border:"1px solid #2a2a3a",color:"white"}}/>
          <button onClick={sendResetCode} disabled={loading} style={{width:"100%",marginTop:12,padding:14,borderRadius:12,background:"#7c3aed",color:"white",fontWeight:900}}>{loading?"Sending...":"Send 6-digit Reset Code"}</button>
          <button onClick={()=>setStep("login")} style={{width:"100%",marginTop:10,background:"transparent",border:0,color:"white",opacity:0.4,fontSize:12}}>Back to login</button>
        </>}

        {step==="reset" && <>
          <input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="6-digit code" maxLength={6} inputMode="numeric" style={{width:"100%",padding:14,borderRadius:12,background:"#08080f",border:"1px solid #2a2a3a",color:"white",textAlign:"center",letterSpacing:6,fontSize:18,marginBottom:10}}/>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password" style={{width:"100%",padding:14,borderRadius:12,background:"#08080f",border:"1px solid #2a2a3a",color:"white"}}/>
          <button onClick={handleResetPassword} disabled={loading} style={{width:"100%",marginTop:12,padding:14,borderRadius:12,background:"#22c55e",color:"black",fontWeight:900}}>{loading?"Resetting...":"Reset Password"}</button>
        </>}
      </div>
    </div>
  );
}
