import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if(!url ||!key) throw new Error("Missing Supabase ENV");
  return createClient(url,key, { auth: { persistSession: false } });
}

const FIVE_SIM_KEY = process.env.FIVESIM_API_KEY!;
const PROFIT_X = 3;
const NAIRA_RATE = 1600;

const COUNTRY_MAP:any = {
  ng:"nigeria", gh:"ghana", us:"usa", gb:"england", ca:"canada",
  au:"australia", de:"germany", fr:"france", za:"southafrica", ke:"kenya",
  in:"india", id:"indonesia", ph:"philippines", my:"malaysia", sg:"singapore",
  ae:"uae", tr:"turkey", ru:"russia", ua:"ukraine", at:"austria",
  nl:"netherlands", se:"sweden", pl:"poland", br:"brazil"
};

const FALLBACK_COST_DOLLAR:any = {
  whatsapp: 0.134, telegram: 0.11, facebook: 0.07, tiktok: 0.15, google: 0.04, apple: 0.13
};

async function getLiveSellPrice(service:string, countryCode:string){
  const fiveCountry = COUNTRY_MAP[countryCode] || countryCode;
  try {
    const res = await fetch("https://5sim.net/v1/guest/prices", {
      headers: { Authorization: `Bearer ${FIVE_SIM_KEY}` },
      cache: "no-store"
    });
    const data = await res.json();
    let costDollar = data?.[fiveCountry]?.[service]?.cost || data?.[service]?.[fiveCountry]?.cost || 0;
    if(costDollar > 0){
      const costNaira = costDollar * NAIRA_RATE;
      let sellPrice = Math.ceil(costNaira * PROFIT_X / 50) * 50;
      if(sellPrice < 1200) sellPrice = 1200;
      return { costNaira, sellPrice };
    }
  } catch(e){}
  const costDollar = FALLBACK_COST_DOLLAR[service] || 0.13;
  const costNaira = costDollar * NAIRA_RATE;
  let sellPrice = Math.ceil(costNaira * PROFIT_X / 50) * 50;
  if(sellPrice < 1200) sellPrice = 1200;
  return { costNaira, sellPrice };
}

export async function POST(req:NextRequest){
  try{
    const supabase=getAdmin();
    const {country, service, user_id} = await req.json();
    if(!user_id ||!country ||!service){
      return NextResponse.json({error:"Missing fields"}, {status:400});
    }
    const { costNaira, sellPrice } = await getLiveSellPrice(service, country);
    const fiveCountry = COUNTRY_MAP[country] || country;
    const {data:wallet, error:wErr} = await supabase.from("wallets").select("balance").eq("user_id",user_id).maybeSingle();
    if(wErr ||!wallet) return NextResponse.json({error:"Wallet not found"}, {status:400});
    if(wallet.balance < sellPrice) return NextResponse.json({error:`Low balance: Have ₦${wallet.balance} Need ₦${sellPrice}`},{status:400});
    const buyRes = await fetch(`https://5sim.net/v1/user/buy/activation/${fiveCountry}/any/${service}`,{
      headers:{Authorization:`Bearer ${FIVE_SIM_KEY}`, Accept:"application/json"}});
    const buyText = await buyRes.text();
    let buyData:any; try{ buyData = JSON.parse(buyText); } catch{ buyData = {raw:buyText} }
    if(!buyRes.ok) return NextResponse.json({error: "Service unavailable, try again"}, {status:400});
    if(!buyData.phone ||!buyData.id) return NextResponse.json({error:"Number unavailable, try another country"}, {status:400});
    const newBal = wallet.balance - sellPrice;
    await supabase.from("wallets").update({balance:newBal}).eq("user_id",user_id);
    const { data: inserted, error: insErr } = await supabase.from("orders").insert({
      user_id, phone:buyData.phone.toString(), country, service,
      price: sellPrice, sold_price: sellPrice, cost_price: Math.round(costNaira),
      profit: Math.round(sellPrice - costNaira), status:"active",
      provider_id: buyData.id.toString(), fivesim_id: buyData.id.toString()
    }).select().single();
    if(insErr ||!inserted){
      await supabase.from("wallets").update({balance:wallet.balance}).eq("user_id",user_id);
      return NextResponse.json({error:"DB save failed: "+insErr?.message}, {status:500});
    }
    return NextResponse.json({ phone:buyData.phone, orderId: inserted.id, fivesimId: buyData.id, price: sellPrice, balance:newBal });
  } catch(e:any){
    return NextResponse.json({error:"Server error: "+e.message}, {status:500});
  }
}
