import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

const FIVE_SIM_KEY = process.env.FIVESIM_API_KEY || process.env.FIVE_SIM_API_KEY;
const PRICES: any = { nigeria: 736, poland: 490, usa: 850, england: 650, ghana: 580, default: 600 };

export async function POST(req: NextRequest){
  const supabase = getAdmin();
  try {
    const { country, service, user_id } = await req.json();
    if(!user_id) return NextResponse.json({error:"Not logged in"}, {status:401});

    const price = PRICES[country] || PRICES.default;
    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
    if(!wallet || wallet.balance < price) return NextResponse.json({error:`Low balance: Have ₦${wallet?.balance} Need ₦${price}`}, {status:400});

    const countryMap: any = { us:"usa", gb:"england", ng:"nigeria", gh:"ghana", pl:"poland" };
    const realCountry = countryMap[country] || country;

    const buyRes = await fetch(`https://5sim.net/v1/user/buy/activation/${realCountry}/any/${service}`, {
      headers: { Authorization: `Bearer ${FIVE_SIM_KEY}`, Accept: "application/json" }
    });
    const text = await buyRes.text();
    let buyData: any; try{ buyData = JSON.parse(text); } catch{ return NextResponse.json({error:`No numbers: ${text}`}, {status:400}); }
    if(!buyRes.ok) return NextResponse.json({error:`5sim failed: ${text}`}, {status:400});

    const { error: walletError } = await supabase.from("wallets").update({ balance: wallet.balance - price }).eq("user_id", user_id);
    if(walletError) return NextResponse.json({error:"Wallet update failed"}, {status:500});

    // ONLY 7 COLUMNS - GUARANTEED TO WORK
    const { error: orderError } = await supabase.from("orders").insert({
      user_id: user_id,
      phone: buyData.phone,
      country: country,
      service: service,
      price: price,
      status: "active",
      provider_id: buyData.id.toString()
    });

    if(orderError){
      await supabase.from("wallets").update({ balance: wallet.balance }).eq("user_id", user_id);
      await fetch(`https://5sim.net/v1/user/ban/${buyData.id}`, { headers: { Authorization: `Bearer ${FIVE_SIM_KEY}` } });
      return NextResponse.json({error:`Order save failed: ${orderError.message}, money refunded`}, {status:500});
    }
    return NextResponse.json({ success:true, phone: buyData.phone, orderId: buyData.id, price });
  } catch(e:any){ return NextResponse.json({error:e.message}, {status:500}); }
}

export async function GET(req: NextRequest){
  const supabase = getAdmin();
  const searchParams = req.nextUrl.searchParams;
  const checkId = searchParams.get("checkId");
  const action = searchParams.get("action");
  const userId = searchParams.get("userId");
  const amount = searchParams.get("amount");

  if(checkId && action === "cancel" && FIVE_SIM_KEY){
    await fetch(`https://5sim.net/v1/user/ban/${checkId}`, { headers: { Authorization: `Bearer ${FIVE_SIM_KEY}` } });
    if(userId && amount){
      const { data: w } = await supabase.from("wallets").select("balance").eq("user_id", userId).single();
      if(w){
        await supabase.from("wallets").update({ balance: w.balance + Number(amount) }).eq("user_id", userId);
        await supabase.from("orders").update({ status:"canceled" }).eq("provider_id", checkId);
      }
    }
    return NextResponse.json({ status:"CANCELED", refunded:true });
  }

  if(checkId && FIVE_SIM_KEY){
     const res = await fetch(`https://5sim.net/v1/user/check/${checkId}`, { headers: { Authorization: `Bearer ${FIVE_SIM_KEY}` } });
     const data = await res.json();
     let code = data.sms_code || data.code || data.sms?.[0]?.code;
     if(code){
       await supabase.from("orders").update({ status:"completed" }).eq("provider_id", checkId);
       return NextResponse.json({ status:data.status, sms:[{code:String(code).replace(/\D/g,"")}], sms_code:code });
     }
     return NextResponse.json(data);
  }

  const user_id = searchParams.get("user_id");
  if(!user_id) return NextResponse.json([]);
  const { data } = await supabase.from("orders").select("*").eq("user_id", user_id).order("created_at",{ascending:false});
  return NextResponse.json(data || []);
}
