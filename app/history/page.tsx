"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

function getSupabase(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url,key);
}

export default function History(){
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = getSupabase();

  useEffect(()=>{
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if(!session){ router.push("/login"); return; }
      const { data } = await supabase.from("orders").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(100);
      setOrders(data || []);
      setLoading(false);
    }
    load();
  },[]);

  if(loading) return <div style={{minHeight:"100vh",background:"#08080f",color:"white",display:"flex",alignItems:"center",justifyContent:"center"}}>Loading history...</div>;

  return (
    <div style={{minHeight:"100vh",background:"#08080f",color:"white",fontFamily:"sans-serif",padding:20}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h2>📜 Order History</h2>
          <button onClick={()=>router.push("/")} style={{padding:"8px 16px",borderRadius:8,background:"#7c3aed",border:0,color:"white",fontWeight:700}}>← Back Home</button>
        </div>

        <div style={{marginTop:20,display:"grid",gap:10}}>
          {orders.length===0 && <div style={{opacity:0.5,textAlign:"center",marginTop:40}}>No orders yet</div>}
          {orders.map(o=>(
            <div key={o.id} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:800}}>{o.service?.toUpperCase()} • {o.country?.toUpperCase()} • {o.phone}</div>
                <div style={{fontSize:12,opacity:0.6}}>₦{o.price} • {new Date(o.created_at).toLocaleString()} • ID: {o.provider_id}</div>
              </div>
              <div style={{
                padding:"6px 12px",borderRadius:20,fontSize:11,fontWeight:900,
                background: o.status==="active"?"#facc15": o.status==="completed"?"#22c55e":"#ef4444",
                color: o.status==="active"?"black":"white"
              }}>{o.status.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
