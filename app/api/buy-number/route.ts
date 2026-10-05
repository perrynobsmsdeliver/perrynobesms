import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const FIVE_SIM_KEY = process.env.FIVESIM_API_KEY!;
const PROFIT_X = 1.5; // Your x1.5 profit — change to 1.8 if you want
const NAIRA_RATE = 1600; // $1 = ₦1600

const COUNTRY_MAP: any = {
  us: "usa", gb: "england", ca: "canada", gh: "ghana", za: "southafrica",
  de: "germany", fr: "france", at: "austria", au: "australia", nl: "netherlands",
  se: "sweden", pl: "poland", in: "india", id: "indonesia", br: "brazil",
  ru: "russia", tr: "turkey", ng: "nigeria", ke: "kenya", ua: "ukraine"
};

async function getLiveCost(service: string, countryCode: string) {
  const fiveCountry = COUNTRY_MAP[countryCode] || countryCode;
  const svc = service.toLowerCase();
  try {
    // Try guest prices first
    const res = await fetch(`https://5sim.net/v1/guest/prices?product=${svc}`, { cache: "no-store" });
    const json = await res.json();
    let cost = json?.[fiveCountry]?.cost?? 0;
    if (cost > 0) return Number(cost);

    // Try user prices with your key
    const res2 = await fetch(`https://5sim.net/v1/user/prices?product=${svc}`, {
      headers: { Authorization: `Bearer ${FIVE_SIM_KEY}` },
      cache: "no-store"
    });
    const json2 = await res2.json();
    cost = json2?.[fiveCountry]?.cost?? json2?.Price?.[fiveCountry]?.cost?? 0;
    if (cost > 0) return Number(cost);
  } catch {}
  return 0; // No fallback — real out of stock
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getAdmin();
    const { country, service, user_id } = await req.json();

    const fiveCountry = COUNTRY_MAP[country] || country;
    const costDollar = await getLiveCost(service, country);

    if (!costDollar || costDollar === 0) {
      return NextResponse.json(
        { error: `No number available for ${service} in ${country.toUpperCase()} right now, try another country` },
        { status: 400 }
      );
    }

    const costNaira = costDollar * NAIRA_RATE;
    // LIVE FORMULA
    let sellPrice = Math.ceil((costNaira * PROFIT_X) / 50) * 50;

    // Small minimum so you don't sell at loss, NOT 1200
    if (sellPrice < 500) sellPrice = 500;

    const { data: wallet } = await supabase
     .from("wallets")
     .select("balance")
     .eq("user_id", user_id)
     .maybeSingle();

    if (!wallet || wallet.balance < sellPrice) {
      return NextResponse.json(
        { error: `Low balance: Need ₦${sellPrice} (Live cost $${costDollar} x ${NAIRA_RATE} x ${PROFIT_X})` },
        { status: 400 }
      );
    }

    const buyRes = await fetch(
      `https://5sim.net/v1/user/buy/activation/${fiveCountry}/any/${service.toLowerCase()}`,
      { headers: { Authorization: `Bearer ${FIVE_SIM_KEY}` } }
    );
    const buyData = await buyRes.json();

    if (!buyRes.ok ||!buyData.phone) {
      return NextResponse.json(
        { error: buyData.message || "Number unavailable, try another country" },
        { status: 400 }
      );
    }

    const newBal = wallet.balance - sellPrice;
    await supabase.from("wallets").update({ balance: newBal }).eq("user_id", user_id);

    const { data: inserted } = await supabase
     .from("orders")
     .insert({
        user_id,
        phone: buyData.phone.toString(),
        country,
        service: service.toLowerCase(),
        price: sellPrice,
        sold_price: sellPrice,
        cost_price: Math.round(costNaira),
        profit: Math.round(sellPrice - costNaira),
        status: "active",
        provider_id: buyData.id.toString(),
        fivesim_id: buyData.id.toString()
      })
     .select()
     .single();

    return NextResponse.json({
      phone: buyData.phone,
      orderId: inserted.id,
      price: sellPrice,
      balance: newBal,
      liveCost: `$${costDollar}`,
      formula: `${costDollar} * ${NAIRA_RATE} * ${PROFIT_X} = ${sellPrice}`
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
