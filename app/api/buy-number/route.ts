import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin(){
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {auth:{persistSession:false}});
}
const FIVE_SIM_KEY = process.env.FIVESIM_API_KEY!;
const PROFIT_X = 1.8; // X1.8 FOR LAUNCH - NOT 3
const NAIRA_RATE = 1600;
const COUNTRY_MAP:any = { us:"usa", gb:"england", ca:"canada", gh:"ghana", za:"southafrica", de:"germany", fr:"france", at:"austria", au:"australia", nl:"netherlands", se:"sweden", pl:"poland", in:"india", id:"indonesia", br:"brazil", ru:"russia", tr:"turkey" };

async function getCheapestCost(service:string, countryCode:string){
  const fiveCountry = COUNTRY_MAP[countryCode] || countryCode;
  try{
    const res = await fetch(`https://5sim.net/v1/guest/products/${fiveCountry}/any`,{cache:"no-store"});
    const json = await res.json();
    let costs:number[] = [];
    if(Array.isArray(json)){
      json.forEach((p:any)=>{ if((p.product||p.name||"").toLowerCase()===service){ const c=p.Price||p.cost||0; if(c>0) costs.push(Number(c)); }});
    } else {
      Object.values(json).forEach((v:any)=>{ const c=v?.Price||v?.Cost||0; if(c>0) costs.push(Number(c)); });
    }
    if(costs.length>0) return Math.min(...costs);
  }catch{}
  return 0.85; // current USA WhatsApp real price today
}

export async function POST(req:NextRequest){
  try{
    const supabase=getAdmin();
    const {country, service, user_id} = await req.json();
    const fiveCountry = COUNTRY_MAP[country] || country;
    const costDollar = await getCheapestCost(service, country);
    const costNaira = costDollar * NAIRA_RATE;
    let sellPrice = costNaira * PROFIT_X; // 1.8
    sellPrice = Math.ceil(sellPrice/50)*50;
    if(sellPrice < 1200) sellPrice = 1200;

    const {data:wallet} = await supabase.from("wallets").select("balance").eq("user_id",user_id).maybeSingle();
    if(!wallet || wallet.balance < sellPrice) return NextResponse.json({error:`Low balance: Need ₦${sellPrice}`},{status:400});

    const buyRes = await fetch(`https://5sim.net/v1/user/buy/activation/${fiveCountry}/any/${service}`,{headers:{Authorization:`Bearer ${FIVE_SIM_KEY}`}});
    const buyData = await buyRes.json();
    if(!buyRes.ok ||!buyData.phone) return NextResponse.json({error:"Number unavailable, try another country"},{status:400});

    const newBal = wallet.balance - sellPrice;
    await supabase.from("wallets").update({balance:newBal}).eq("user_id",user_id);
    const {data:inserted} = await supabase.from("orders").insert({ user_id, phone:buyData.phone.toString(), country, service, price:sellPrice, sold_price:sellPrice, cost_price:Math.round(costNaira), profit:Math.round(sellPrice-costNaira), status:"active", provider_id:buyData.id.toString(), fivesim_id:buyData.id.toString() }).select().single();
    return NextResponse.json({phone:buyData.phone, orderId:inserted.id, price:sellPrice, balance:newBal});
  }catch(e:any){
    return NextResponse.json({error:e.message},{status:500});
  }
}
