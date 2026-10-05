import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
}

const FIVE_SIM_KEY = process.env.FIVESIM_API_KEY!;
const NAIRA_RATE = 1600;

const COUNTRY_MAP: any = {
  us: "usa", gb: "england", ca: "canada", gh: "ghana", za: "southafrica",
  de: "germany", fr: "france", at: "austria", au: "australia", nl: "netherlands",
  se: "sweden", pl: "poland", in: "india", id: "indonesia", br: "brazil",
  ru: "russia", tr: "turkey", ng: "nigeria"
};

const FALLBACK_COST: any = {
  whatsapp: 0.85, telegram: 0.12, facebook: 0.08, tiktok: 0.12, google: 0.15,
  instagram: 0.15, signal: 0.04, discord: 0.08, twitter: 0.10, amazon: 0.12,
  uber: 0.10, netflix: 0.15, microsoft: 0.12, yahoo: 0.08, snapchat: 0.10,
  linkedin: 0.12, openai: 0.20, paypal: 0.15, apple: 0.12, tumblr: 0.08
};

async function getLiveCost(service: string, countryCode: string) {
  const fiveCountry = COUNTRY_MAP[countryCode] || countryCode;
  const svc = service.toLowerCase();
  try {
    const res = await fetch(`https://5sim.net/v1/guest/prices?product=${svc}`, { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      let c = j?.[fiveCountry]?.cost?? j?.[fiveCountry.toLowerCase()]?.cost?? 0;
      if (c > 0) return Number(c);
    }
  } catch {}
  try {
    const res2 = await fetch(`https://5sim.net/v1/user/prices?product=${svc}`, {
      headers: { Authorization: `Bearer ${FIVE_SIM_KEY}` }, cache: "no-store"
    });
    if (res2.ok) {
      const j2 = await res2.json();
      let c = j2?.[fiveCountry]?.cost?? j2?.Price?.[fiveCountry]?.cost?? 0;
      if (c > 0) return Number(c);
    }
  } catch {}
  return FALLBACK_COST[svc] || 0.35;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getAdmin();
    const { country, service, user_id } = await req.json();
    const fiveCountry = COUNTRY_MAP[country] || country;
    const PROFIT_X = service.toLowerCase() === "whatsapp"? 1.5 : 3.0;
    const costDollar = await getLiveCost(service, country);
    const costNaira = costDollar * NAIRA_RATE;
    let sellPrice = Math.ceil((costNaira * PROFIT_X) / 50) * 50;
    if (sellPrice < 500) sellPrice = 500;

    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", user_id).maybeSingle();
    if (!wallet || wallet.balance < sellPrice) {
      return NextResponse.json({ error: `Low balance: Need ₦${sellPrice} (Live $${costDollar} x ${NAIRA_RATE} x ${PROFIT_X})` }, { status: 400 });
    }

    const buyRes = await fetch(`https://5sim.net/v1/user/buy/activation/${fiveCountry}/any/${service.toLowerCase()}`, {
      headers: { Authorization: `Bearer ${FIVE_SIM_KEY}` }
    });
    const buyData = await buyRes.json();
    if (!buyRes.ok ||!buyData.phone) {
      return NextResponse.json({ error: buyData.message || "Number unavailable, try another country" }, { status: 400 });
    }

    const newBal = wallet.balance - sellPrice;
    await supabase.from("wallets").update({ balance: newBal }).eq("user_id", user_id);
    const { data: inserted } = await supabase.from("orders").insert({
        user_id, phone: buyData.phone.toString(), country, service: service.toLowerCase(),
        price: sellPrice, sold_price: sellPrice, cost_price: Math.round(costNaira),
        profit: Math.round(sellPrice - costNaira), status: "active",
        provider_id: buyData.id.toString(), fivesim_id: buyData.id.toString()
      }).select().single();

    return NextResponse.json({ phone: buyData.phone, orderId: inserted.id, price: sellPrice, balance: newBal });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
