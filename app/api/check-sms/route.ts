import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = 'force-dynamic';

export async function GET(req: Request){
  const { searchParams } = new URL(req.url);
  const orderId = String(searchParams.get("orderId")||"");
  if(!orderId) return NextResponse.json({ sms:null, status:"MISSING_ID" });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  let order:any=null;
  let r = await supabase.from("orders").select("*").eq("provider_id", orderId).maybeSingle();
  if(r.data) order=r.data;
  if(!order){ r = await supabase.from("orders").select("*").eq("fivesim_id", orderId).maybeSingle(); if(r.data) order=r.data; }
  if(!order){ r = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle(); if(r.data) order=r.data; }

  const fiveId = order?.fivesim_id || order?.provider_id || orderId;

  try{
    const res = await fetch(`https://5sim.net/v1/user/check/${fiveId}`, {
      headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}`, Accept:"application/json" },
      cache: "no-store"
    });
    const data = await res.json();

    // Log for debug
    console.log("5sim check:", fiveId, data);

    // CASE 1: sms is array
    if(Array.isArray(data?.sms) && data.sms.length > 0){
      const code = data.sms[0]?.code || data.sms[0];
      if(code){
        // Update order to received in DB
        if(order?.id){
          await supabase.from("orders").update({ status: "completed", sms_code: code }).eq("id", order.id);
        }
        return NextResponse.json({ sms: code, status: "RECEIVED", full: data });
      }
    }
    // CASE 2: sms is object {code}
    if(data?.sms?.code){
      if(order?.id){
        await supabase.from("orders").update({ status: "completed", sms_code: data.sms.code }).eq("id", order.id);
      }
      return NextResponse.json({ sms: data.sms.code, status: "RECEIVED", full: data });
    }
    // CASE 3: sms is string directly
    if(typeof data?.sms==="string" && data.sms.length > 0){
      return NextResponse.json({ sms: data.sms, status: "RECEIVED", full: data });
    }

    // Still waiting
    return NextResponse.json({ sms: null, status: data?.status || "PENDING", full: data });

  }catch(e:any){
    console.error("check-sms error:", e.message);
    return NextResponse.json({ sms:null, status:"ERROR", error:e.message });
  }
}
