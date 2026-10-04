import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function GET(req: Request){
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  if(!orderId) return NextResponse.json({ sms:null });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find your internal order first
  let { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if(!order){
    const { data: a } = await supabase.from("orders").select("*").eq("fivesim_id", orderId).single();
    if(a) order = a as any;
  }
  if(!order){
    const { data: b } = await supabase.from("orders").select("*").eq("provider_id", orderId).single();
    if(b) order = b as any;
  }

  const fiveId = order?.fivesim_id || (order as any)?.provider_id || orderId;

  try{
    const res = await fetch(`https://5sim.net/v1/user/check/${fiveId}`, {
      headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}`, Accept: "application/json" }
    });
    const data = await res.json();
    
    // 5sim returns different formats
    if(data?.sms?.code) return NextResponse.json({ sms: data.sms.code });
    if(typeof data?.sms === "string" && data.sms.length>0) return NextResponse.json({ sms: data.sms });
    if(data?.code) return NextResponse.json({ sms: data.code });

    return NextResponse.json({ sms:null, raw:data });
  }catch(e:any){
    return NextResponse.json({ sms:null, error:e.message });
  }
}
