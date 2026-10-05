import { NextResponse } from "next/server";

const COUNTRY_MAP: any = {
  us: "usa", gb: "england", ca: "canada", gh: "ghana", za: "southafrica",
  de: "germany", fr: "france", at: "austria", au: "australia", nl: "netherlands",
  se: "sweden", pl: "poland", in: "india", id: "indonesia", br: "brazil",
  ru: "russia", tr: "turkey", ng: "nigeria"
};

const COUNTRY_MULT: any = {
  us: 1.2, gb: 1.3, ca: 1.15, au: 1.15, de: 1.1, fr: 1.1, at: 1.1, nl: 1.1, se: 1.1,
  pl: 0.9, ru: 0.8, tr: 0.85, br: 0.9, in: 0.7, id: 0.7, gh: 0.75, za: 0.8, ng: 0.75
};

const FALLBACK_COST: any = {
  whatsapp: 0.85, telegram: 0.12, facebook: 0.08, tiktok: 0.12, google: 0.15,
  instagram: 0.15, signal: 0.04, discord: 0.08, twitter: 0.10, amazon: 0.12,
  uber: 0.10, netflix: 0.15, microsoft: 0.12, yahoo: 0.08, snapchat: 0.10,
  linkedin: 0.12, openai: 0.20, paypal: 0.15, apple: 0.12, tumblr: 0.08
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const service = (searchParams.get("service") || "whatsapp").toLowerCase();
  const country = (searchParams.get("country") || "us").toLowerCase();
  const fiveCountry = COUNTRY_MAP[country] || country;
  const NAIRA = 1600;
  const PROFIT = service === "whatsapp"? 1.5 : 3.0;
  const countryMult = COUNTRY_MULT[country] || 1.0;

  let liveCost = 0;
  let source = "fallback";

  try {
    const r = await fetch(`https://5sim.net/v1/guest/prices?product=${service}`, { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      liveCost = j?.[fiveCountry]?.cost?? j?.[fiveCountry.toLowerCase()]?.cost?? 0;
      if (liveCost > 0) source = "live";
    }
  } catch {}

  if (!liveCost && process.env.FIVESIM_API_KEY) {
    try {
      const r2 = await fetch(`https://5sim.net/v1/user/prices?product=${service}`, {
        headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}` }, cache: "no-store"
      });
      if (r2.ok) {
        const j2 = await r2.json();
        liveCost = j2?.[fiveCountry]?.cost?? j2?.Price?.[fiveCountry]?.cost?? 0;
        if (liveCost > 0) source = "live";
      }
    } catch {}
  }

  if (!liveCost) {
    liveCost = FALLBACK_COST[service] || 0.35;
  }

  let finalPrice = Math.ceil((liveCost * NAIRA * PROFIT * countryMult) / 50) * 50;
  if (finalPrice < 500) finalPrice = 500;

  return NextResponse.json({
    price: finalPrice,
    liveCostDollar: liveCost,
    profit: PROFIT,
    countryMult,
    source,
    service,
    country
  });
}
