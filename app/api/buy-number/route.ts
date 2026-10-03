import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

const FIVE_SIM_KEY = process.env.FIVE_SIM_API_KEY; // you must add this in Vercel

export async function POST(req: NextRequest){
  const supabase = getAdmin();
  try {
    const { country, service, user_id, price } = await req.json();
    if(!user_id) return NextResponse.json({error:"Not logged in"}, {status:401});
    if(!FIVE_SIM_KEY) return NextResponse.json({error:"Server missing FIVE_SIM_API_KEY - add it in Vercel ENV"}, {status:500});

    // 1. check balance
    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
    if(!wallet || wallet.balance < price) return NextResponse.json({error:`Insufficient: Have ₦${wallet?.balance} Need ₦${price}`}, {status:400});

    // 2. BUY REAL NUMBER FROM 5SIM
    // country: usa, england, nigeria etc - map yours
    const countryMap: any = { us:"usa", gb:"england", ng:"nigeria", gh:"ghana", za:"southafrica", ke:"kenya", ca:"canada", in:"india" };
    const serviceMap: any = { whatsapp:"whatsapp", telegram:"telegram", facebook:"facebook", tiktok:"tiktok", google:"google", instagram:"instagram", signal:"signal", uber:"uber" };

    const realCountry = countryMap[country] || "usa";
    const realService = serviceMap[service] || service;

    const buyRes = await fetch(`https://5sim.net/v1/user/buy/activation/${realCountry}/any/${realService}`, {
      headers: { Authorization: `Bearer ${FIVE_SIM_KEY}`, Accept: "application/json" }
    });
    const buyData = await buyRes.json();
    if(!buyRes.ok) return NextResponse.json({error:`Provider failed: ${JSON.stringify(buyData)}`}, {status:400});

    const phone = buyData.phone; // real phone
    const orderId = buyData.id; // 5sim order id to check SMS later

    // 3. deduct only AFTER provider success
    await supabase.from("wallets").update({ balance: wallet.balance - price }).eq("user_id", user_id);
    // 4. save
    await supabase.from("orders").insert({
      user_id, phone, country, service, price, status:"active", otp:null, provider_id: orderId.toString()
    });

    return NextResponse.json({ success:true, phone, orderId, message:"Real number bought! Waiting for SMS..." });

  } catch(e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}

// CHECK SMS REAL
export async function GET(req: NextRequest){
  const supabase = getAdmin();
  const user_id = req.nextUrl.searchParams.get("user_id");
  const checkId = req.nextUrl.searchParams.get("checkId");

  if(checkId && FIVE_SIM_KEY){
     const res = await fetch(`https://5sim.net/v1/user/check/${checkId}`, {
       headers: { Authorization: `Bearer ${FIVE_SIM_KEY}`, Accept:"application/json" }
     });
     const data = await res.json();
     return NextResponse.json(data); // contains sms code
  }

  if(!user_id) return NextResponse.json([]);
  const { data } = await supabase.from("orders").select("*").eq("user_id", user_id).order("created_at",{ascending:false});
  return NextResponse.json(data || []);
}
