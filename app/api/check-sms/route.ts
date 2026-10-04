import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = 'force-dynamic';
export async function GET(req: Request){
  const { searchParams } = new URL(req.url);
  const orderId = String(searchParams.get("orderId")||"");
  if(!orderId) return NextResponse.json({ sms:null });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  let order:any=null;
  let r = await supabase.from("orders").select("*").eq("provider_id", orderId).maybeSingle();
  if(r.data) order=r.data;
  if(!order){ r = await supabase.from("orders").select("*").eq("fivesim_id", orderId).maybeSingle(); if(r.data) order=r.data; }
  if(!order){ r = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle(); if(r.data) order=r.data; }
  const fiveId = order?.fivesim_id || order?.provider_id || orderId;
  try{
    const res = await fetch(`https://5sim.net/v1/user/check/${fiveId}`, { headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}`, Accept:"application/json" } });
    const data = await res.json();
    if(data?.sms?.code) return NextResponse.json({ sms: data.sms.code });
    if(typeof data?.sms==="string") return NextResponse.json({ sms:data.sms });
    if(data?.sms?.[0]?.code) return NextResponse.json({ sms:data.sms[0].code });
  }catch{}
  return NextResponse.json({ sms:null });
}
