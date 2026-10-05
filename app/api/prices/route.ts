import { NextResponse } from "next/server";

const COUNTRY_MAP: any = {
  us: "usa", gb: "england", ca: "canada", gh: "ghana", za: "southafrica",
  de: "germany", fr: "france", at: "austria", au: "australia", nl: "netherlands",
  se: "sweden", pl: "poland", in: "india", id: "indonesia", br: "brazil",
  ru: "russia", tr: "turkey", ng: "nigeria"
};

const FALLBACK_COST: any = {
  whatsapp: 0.85, telegram: 0.12, facebook: 0.08,
  tiktok: 0.12, google: 0.15, instagram: 0.15,
  signal: 0.04, discord: 0.08, twitter: 0.10,
  amazon: 0.12, uber: 0.10, netflix: 0.15,
  microsoft: 0.12, yahoo: 0.08, snapchat: 0.10,
  linkedin: 0.12, openai: 0.20, paypal: 0.15, apple: 0.12, tumblr: 0.08
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const service = (searchParams.get("service") || "whatsapp").toLowerCase();
  const country = (searchParams.get("country") || "us").toLowerCase();
  const fiveCountry = COUNTRY_MAP[country] || country;

  const NAIRA = 1600;
  const PROFIT = 1.5;
  let liveCost = 0;
  let source = "fallback";

  try {
    // 1. Try guest (no key needed)
    const guestRes = await fetch(`https://5sim.net/v1/guest/prices?product=${service}`, {
      cache: "no-store",
      headers: { "Accept": "application/json" }
    });
    if (guestRes.ok) {
      const guestData = await guestRes.json();
      liveCost = guestData?.[fiveCountry]?.cost?? guestData?.[fiveCountry.toLowerCase()]?.cost?? 0;
      if (liveCost > 0) source = "guest-live";
    }
  } catch (e) {}

  try {
    // 2. Try user (needs key)
    if (!liveCost && process.env.FIVESIM_API_KEY) {
      const userRes = await fetch(`https://5sim.net/v1/user/prices?product=${service}`, {
        headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}` },
        cache: "no-store"
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        liveCost = userData?.[fiveCountry]?.cost?? userData?.[fiveCountry.toLowerCase()]?.cost?? userData?.Price?.[fiveCountry]?.cost?? 0;
        if (liveCost > 0) source = "user-live";
      }
    }
  } catch (e) {}

  // 3. Fallback if 5sim fails — so you NEVER see Out of stock
  if (!liveCost || liveCost === 0) {
    liveCost = FALLBACK_COST[service] || 0.35;
    source = "fallback";
  }

  const finalPrice = Math.ceil((liveCost * NAIRA * PROFIT) / 50) * 50;

  return NextResponse.json({
    price: finalPrice < 500? 500 : finalPrice,
    liveCostDollar: liveCost,
    source,
    service,
    country: fiveCountry,
    formula: `$${liveCost} x ${NAIRA} x ${PROFIT} = ${finalPrice}`
  });
}
