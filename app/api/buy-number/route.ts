import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url,key);
}
const FIVE_SIM_KEY = process.env.FIVESIM_API_KEY!;

const PRICE_MATRIX:any = {
  whatsapp:{us:1890,gb:1840,ng:1808,gh:1760},
  telegram:{us:1720,gb:1680,ng:1648},
  google:{us:560,gb:540,ng:512,gh:490},
  facebook:{us:1100,gb:1060,ng:1024},
  tiktok:{us:2010,gb:1960,ng:1920}
};
const FALLBACK:any = { whatsapp:1808, telegram:1648, facebook:1024, tiktok:1920, google:512, instagram:976, openai:608 };

function getPrice(service:string, country:string){
  const matrix=PRICE_MATRIX[service];
  if(matrix && matrix[country]) return matrix[country];
  return FALLBACK[service]||1000;
}

export async function POST(req:NextRequest){
  const supabase=getAdmin();
  const {country, service, user_id} = await req.json();
  const price = getPrice(service, country); // SERVER CALCULATES - no trust client

  const {data:wallet} = await supabase.from("wallets").select("balance").eq("user_id",user_id).single();
  if(!wallet || wallet.balance < price) return NextResponse.json({error:`Low balance: Have ₦${wallet?.balance||0} Need ₦${price}`},{status:400});

  const realCountry = country==="ng"?"russia":country; // 5sim mapping for NG
  const buyRes = await fetch(`https://5sim.net/v1/user/buy/activation/${realCountry}/any/${service}`,{
    headers:{Authorization:`Bearer ${FIVE_SIM_KEY}`}});
  const buyData = await buyRes.json();
  if(!buyRes.ok) return NextResponse.json({error:JSON.stringify(buyData)},{status:400});

  await supabase.from("wallets").update({balance:wallet.balance - price}).eq("user_id",user_id);
  await supabase.from("orders").insert({user_id, phone:buyData.phone, country, service, price, status:"active", provider_id:buyData.id.toString()});

  return NextResponse.json({phone:buyData.phone, orderId:buyData.id, price});
}
//... keep your GET cancel logic same as before
