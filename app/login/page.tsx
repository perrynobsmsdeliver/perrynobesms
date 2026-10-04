"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function LoginPage() {
  const [email, setEmail] = useState(""); const [code, setCode] = useState("");
  const [step, setStep] = useState("email"); const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sendCode = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options:{shouldCreateUser:true} });
    setLoading(false);
    if(error) alert(error.message); else setStep("code");
  };
  const verifyCode = async () => {
    setLoading(true);
    const { error, data } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    setLoading(false);
    if(error) alert(error.message);
    else { await supabase.from("wallets").upsert({ user_id: data.user?.id, balance:0 },{onConflict:"user_id"}); router.push("/"); }
  };
  return (
    <div style={{minHeight:"100vh",background:"#08080f",color:"white",display:"grid",placeItems:"center",padding:16}}>
      <div style={{background:"#12121f",border:"1px solid #232334",borderRadius:20,padding:24,width:"100%",maxWidth:360}}>
        <h2>PerryNobe</h2><p style={{fontSize:12,opacity:0.5,marginBottom:20}}>Login with code</p>
        {step==="email"?<>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter email" style={{width:"100%",padding:14,borderRadius:12,background:"#08080f",border:"1px solid #2a2a3a",color:"white"}}/>
          <button onClick={sendCode} disabled={loading} style={{width:"100%",marginTop:12,padding:14,borderRadius:12,background:"#7c3aed",color:"white",fontWeight:900}}>{loading?"Sending...":"Send Code"}</button>
        </>:<>
          <input value={code} onChange={e=>setCode(e.target.value)} placeholder="6-digit code" style={{width:"100%",padding:14,borderRadius:12,background:"#08080f",border:"1px solid #2a2a3a",color:"white",textAlign:"center",letterSpacing:4,fontSize:18}}/>
          <button onClick={verifyCode} disabled={loading} style={{width:"100%",marginTop:12,padding:14,borderRadius:12,background:"#22c55e",color:"black",fontWeight:900}}>{loading?"Verifying...":"Verify & Login"}</button>
          <button onClick={()=>setStep("email")} style={{width:"100%",marginTop:10,background:"transparent",border:0,color:"white",opacity:0.4,fontSize:12}}>Change email</button>
        </>}
      </div>
    </div>
  );
}
