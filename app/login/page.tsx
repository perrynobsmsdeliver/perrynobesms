"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Login(){
  const [email,setEmail]=useState(""); const [pass,setPass]=useState("");
  const [isLogin,setIsLogin]=useState(true); const router=useRouter();
  const submit=async()=>{
    if(isLogin){
      const {error}=await supabase.auth.signInWithPassword({email,password:pass});
      if(error) alert(error.message); else router.push("/");
    }else{
      const {error}=await supabase.auth.signUp({email,password:pass});
      if(error) alert(error.message); else { alert("Account created! Now login"); setIsLogin(true); }
    }
  };
  return(
    <div style={{ minHeight:"100vh", background:"#08080f", display:"flex", alignItems:"center", justifyContent:"center", padding:20, color:"white" }}>
      <div style={{ background:"#15151f", padding:30, borderRadius:20, width:"100%", maxWidth:360, border:"1px solid #333" }}>
        <h2>🟣 PerryNobe {isLogin?"Login":"Sign Up"}</h2>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" style={{ width:"100%", padding:12, marginTop:12, borderRadius:10, background:"black", border:"1px solid #333", color:"white" }}/>
        <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password" type="password" style={{ width:"100%", padding:12, marginTop:10, borderRadius:10, background:"black", border:"1px solid #333", color:"white" }}/>
        <button onClick={submit} style={{ width:"100%", padding:14, marginTop:14, borderRadius:10, background:"linear-gradient(90deg,#7c3aed,#4f46e5)", border:0, color:"white", fontWeight:900 }}>{isLogin?"Login":"Create Account"}</button>
        <p onClick={()=>setIsLogin(!isLogin)} style={{ textAlign:"center", marginTop:12, fontSize:12, opacity:0.6, cursor:"pointer" }}>{isLogin?"No account? Sign Up":"Have account? Login"}</p>
      </div>
    </div>
  )
}
