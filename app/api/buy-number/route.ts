import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if(!url ||!key) throw new Error("Missing Supabase ENV");
  return createClient(url,key, { auth: { persistSession: false } });
}
const FIVE_SIM_KEY = process.env.FIVESIM_API_KEY!;
const PROFIT_X = 10; // YOUR PROFIT
const NAIRA_RATE = 1600;

const COUNTRY_MAP:any = {
  ng:"nigeria", gh:"ghana", us:"usa", gb:"england", ca:"canada",
  au:"australia", de:"germany", fr:"france", za:"southafrica", ke:"kenya",
  in:"india", id:"indonesia", ph:"philippines", my:"malaysia", sg:"singapore",
  ae:"uae", tr:"turkey", ru:"russia", ua:"ukraine"
};

const FALLBACK_COST_DOLLAR:any = {
  whatsapp: 0.134, telegram: 0.11, facebook: 0.07, tiktok: 0.15, google: 0.04
};

// This function gets LIVE cost from 5sim and does ×10
async function getLiveSellPrice(service:string, countryCode:string){
  const fiveCountry = COUNTRY_MAP[countryCode] || countryCode;
  try {
    const res = await fetch("https://5sim.net/v1/guest/prices", {
      headers: { Authorization: `Bearer ${FIVE_SIM_KEY}` },
      cache: "no-store"
    });
    const data = await res.json();
    if(data[service] && data[service][fiveCountry]){
      const costDollar = data[service][fiveCountry].cost; // e.g 0.134
      const costNaira = costDollar * NAIRA_RATE; // 214
      const sellPrice = Math.ceil(costNaira * PROFIT_X / 50) * 50; // 2140
      return { costNaira, sellPrice, costDollar };
    }
  } catch(e){ console.log("Live price fail", e) }
  // Fallback if API fail - use your example ₦214
  const costDollar = FALLBACK_COST_DOLLAR[service] || 0.13;
  const costNaira = costDollar * NAIRA_RATE;
  const sellPrice = Math.ceil(costNaira * PROFIT_X / 50) * 50;
  return { costNaira, sellPrice, costDollar };
}

// POST = BUY
export async function POST(req:NextRequest){
  try{
    const supabase=getAdmin();
    const {country, service, user_id} = await req.json();
    if(!user_id ||!country ||!service){
      return NextResponse.json({error:"Missing fields"}, {status:400});
    }

    // CALCULATE SELL PRICE IN BACKEND - NO HACK POSSIBLE
    const { costNaira, sellPrice, costDollar } = await getLiveSellPrice(service, country);
    const fiveCountry = COUNTRY_MAP[country] || country;

    const {data:wallet, error:wErr} = await supabase.from("wallets").select("balance").eq("user_id",user_id).single();
    if(wErr ||!wallet) return NextResponse.json({error:"Wallet not found: "+wErr?.message}, {status:400});
    if(wallet.balance < sellPrice) return NextResponse.json({error:`Low balance: Have ₦${wallet.balance} Need ₦${sellPrice}`},{status:400});

    const buyRes = await fetch(`https://5sim.net/v1/user/buy/activation/${fiveCountry}/any/${service}`,{
      headers:{Authorization:`Bearer ${FIVE_SIM_KEY}`, Accept:"application/json"}});
    const buyText = await buyRes.text();
    let buyData:any; try{ buyData = JSON.parse(buyText); } catch{ buyData = {raw:buyText} }
    if(!buyRes.ok) return NextResponse.json({error: buyData.message || JSON.stringify(buyData) }, {status:400});
    if(!buyData.phone ||!buyData.id) return NextResponse.json({error:"5sim no phone: " + JSON.stringify(buyData)}, {status:400});

    const newBal = wallet.balance - sellPrice;
    const {error:uErr} = await supabase.from("wallets").update({balance:newBal}).eq("user_id",user_id);
    if(uErr) return NextResponse.json({error:"Balance update failed: "+uErr.message},{status:500});

    // SAVE COST + SELL + PROFIT
    await supabase.from("orders").insert({
      user_id,
      phone:buyData.phone.toString(),
      country,
      service,
      price: sellPrice, // customer pays 2140
      cost_price: Math.round(costNaira), // you paid 214
      profit: Math.round(sellPrice - costNaira), // profit 1926
      status:"active",
      provider_id: buyData.id.toString()
    });

    return NextResponse.json({phone:buyData.phone, orderId:buyData.id, price: sellPrice, balance:newBal});
  } catch(e:any){
    return NextResponse.json({error:e.message || "Server error"}, {status:500});
  }
}

// GET = CHECK SMS + FINISH + CANCEL
export async function GET(req:NextRequest){
  try{
    const supabase = getAdmin();
    const { searchParams } = new URL(req.url);
    const checkId = searchParams.get("checkId");
    const action = searchParams.get("action");

    if(!checkId) return NextResponse.json({error:"checkId missing"}, {status:400});

    if(action === "finish"){
      await fetch(`https://5sim.net/v1/user/finish/${checkId}`, {
        headers: { Authorization: `Bearer ${FIVE_SIM_KEY}` }
      });
      await supabase.from("orders").update({ status: "completed" }).eq("provider_id", checkId);
      return NextResponse.json({ success: true });
    }

    if(action === "cancel"){
      await fetch(`https://5sim.net/v1/user/cancel/${checkId}`, {
        headers: { Authorization: `Bearer ${FIVE_SIM_KEY}` }
      });
      const { data: order } = await supabase.from("orders").select("*").eq("provider_id", checkId).single();
      if(order && order.status === "active"){
        const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", order.user_id).single();
        const newBal = (Number(wallet?.balance) || 0) + Number(order.price || 0);
        await supabase.from("wallets").update({ balance: newBal }).eq("user_id", order.user_id);
        await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
        return NextResponse.json({ success: true, balance: newBal });
      }
      return NextResponse.json({ success: true });
    }

    const res = await fetch(`https://5sim.net/v1/user/check/${checkId}`, {
      headers: { Authorization: `Bearer ${FIVE_SIM_KEY}`, Accept: "application/json" }
    });
    const text = await res.text();
    let data:any; try { data = JSON.parse(text); } catch { data = { raw: text } }

    if(data.status === "CANCELED" || data.status === "BANNED"){
      const { data: order } = await supabase.from("orders").select("*").eq("provider_id", checkId).single();
      if(order && order.status === "active"){
        const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", order.user_id).single();
        const newBal = (Number(wallet?.balance) || 0) + Number(order.price || 0);
        await supabase.from("wallets").update({ balance: newBal }).eq("user_id", order.user_id);
        await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
      }
    }

    return NextResponse.json(data);
  }catch(e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}
