import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if(!url ||!key) throw new Error("Missing Supabase ENV");
  return createClient(url,key, { auth: { persistSession: false } });
}
const FIVE_SIM_KEY = process.env.FIVESIM_API_KEY!;

const PRICE_MATRIX:any = {
  whatsapp:{us:1890,gb:1840,ng:1808,gh:1760, ng_real:"nigeria"},
  telegram:{us:1720,gb:1680,ng:1648},
  google:{us:560,gb:540,ng:512,gh:490},
  facebook:{us:1100,gb:1060,ng:1024},
  tiktok:{us:2010,gb:1960,ng:1920},
  instagram:{ng:976},
  signal:{ng:800},
  openai:{ng:608}
};
const FALLBACK:any = { whatsapp:1808, telegram:1648, facebook:1024, tiktok:1920, google:512, instagram:976, openai:608, signal:800 };

// Correct 5sim country map
const COUNTRY_MAP:any = { ng:"nigeria", gh:"ghana", us:"usa", gb:"england", ca:"canada" };

function getPrice(service:string, country:string){
  const matrix=PRICE_MATRIX[service];
  if(matrix && matrix[country]) return matrix[country];
  return FALLBACK[service]||1000;
}

export async function POST(req:NextRequest){
  try{
    const supabase=getAdmin();
    const body = await req.json();
    const {country, service, user_id} = body;

    if(!user_id ||!country ||!service){
      return NextResponse.json({error:"Missing fields"}, {status:400});
    }

    const price = getPrice(service, country);
    const fiveCountry = COUNTRY_MAP[country] || country;

    // 1. Check wallet
    const {data:wallet, error:wErr} = await supabase.from("wallets").select("balance").eq("user_id",user_id).single();
    if(wErr ||!wallet) return NextResponse.json({error:"Wallet not found"}, {status:400});
    if(wallet.balance < price) return NextResponse.json({error:`Low balance: Have ₦${wallet.balance} Need ₦${price}`},{status:400});

    // 2. Buy from 5sim
    const buyRes = await fetch(`https://5sim.net/v1/user/buy/activation/${fiveCountry}/any/${service}`,{
      headers:{Authorization:`Bearer ${FIVE_SIM_KEY}`, Accept:"application/json"}});

    const buyText = await buyRes.text();
    let buyData:any;
    try{ buyData = JSON.parse(buyText); } catch{ buyData = {raw:buyText} }

    if(!buyRes.ok){
      return NextResponse.json({error: buyData.message || JSON.stringify(buyData) }, {status:400});
    }

    if(!buyData.phone ||!buyData.id){
      return NextResponse.json({error:"5sim no phone returned: " + JSON.stringify(buyData)}, {status:400});
    }

    // 3. Debit + Save - ATOMIC
    const newBal = wallet.balance - price;
    const {error:updErr} = await supabase.from("wallets").update({balance:newBal}).eq("user_id",user_id);
    if(updErr) return NextResponse.json({error:"Debit failed: "+updErr.message},{status:500});

    await supabase.from("orders").insert({
      user_id,
      phone:buyData.phone.toString(),
      country,
      service,
      price,
      status:"active",
      provider_id: buyData.id.toString()
    });

    return NextResponse.json({phone:buyData.phone, orderId:buyData.id, price, balance:newBal});

  } catch(e:any){
    console.error("BUY ERROR", e);
    return NextResponse.json({error:e.message || "Server error"}, {status:500});
  }
}
