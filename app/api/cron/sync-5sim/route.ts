import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic='force-dynamic';
export async function GET(){
  const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const key=process.env.FIVESIM_API_KEY;
  const {data:orders}=await supabase.from("orders").select("*").eq("status","waiting").limit(50);
  if(!orders||orders.length==0) return NextResponse.json({checked:0,refunded:0,message:"no waiting orders"});
  let refunded=0; let checked=0;
  for(const o of orders){
    try{
      checked++;
      const pid=o.order_id_5sim||o.fivesim_id||o.order_id||o.provider_id;
      const amt=o.price||o.sold_price||0;
      if(!pid||!o.user_id) continue;
      
      // CHECK STATUS FROM 5SIM
      let fivesimStatus="UNKNOWN";
      try{
        const r=await fetch(`https://5sim.net/v1/user/check/${pid}`,{headers:{Authorization:`Bearer ${key}`,Accept:"application/json"}});
        if(r.ok){ const j=await r.json(); fivesimStatus=j.status||j.Status||"UNKNOWN"; }
      }catch{}

      const isExpiredOn5sim=["CANCELED","CANCELLED","BANNED","TIMEOUT"].includes(fivesimStatus.toUpperCase());
      const isExpiredOnYourSite=(new Date().getTime()-new Date(o.created_at).getTime())>10*60*1000;

      if(isExpiredOn5sim || isExpiredOnYourSite){
        // Cancel on 5sim if not already cancelled
        try{ await fetch(`https://5sim.net/v1/user/cancel/${pid}`,{headers:{Authorization:`Bearer ${key}`}}); }catch{}
        // Refund wallet
        const {data:w}=await supabase.from("wallets").select("balance").eq("user_id",o.user_id).single();
        if(w){ await supabase.from("wallets").update({balance:Number(w.balance)+Number(amt)}).eq("user_id",o.user_id); }
        await supabase.from("orders").update({status:"canceled"}).eq("id",o.id);
        refunded++;
      }
    }catch{}
  }
  return NextResponse.json({checked,refunded});
}
