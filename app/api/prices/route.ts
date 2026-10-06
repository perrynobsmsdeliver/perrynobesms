import { NextResponse } from "next/server";

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const service = (searchParams.get("service") || "whatsapp").toLowerCase();
  const country = (searchParams.get("country") || "us").toLowerCase();
  const fiveCountry = COUNTRY_MAP[country] || country;

  const NAIRA = Number(process.env.USD_TO_NGN || 1600);
  const PROFIT = 1.5;

  let liveCost = 0;
  let cheapestOperator = "any";
  let source = "fallback";

  try {
    const r = await fetch(`https://5sim.net/v1/guest/prices?country=${fiveCountry}&product=${service}`, { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      const countryData = j[fiveCountry] || j[fiveCountry.toLowerCase()] || j[country] || {};
      const serviceData = countryData[service];
      if (serviceData && typeof serviceData === 'object') {
        let min = Infinity;
        for (const [op, val] of Object.entries(serviceData as any)) {
          const price = typeof val === 'number'? val : (val as any).cost || (val as any).price || 0;
          const count = typeof val === 'number'? 999 : (val as any).count || 0;
          if (price > 0 && count > 0 && price < min) {
            min = price;
            cheapestOperator = op;
          }
        }
        if (min!== Infinity) {
          liveCost = min;
          source = "live-cheapest";
        }
      }
    }
  } catch (e) {
    console.error("guest price fail", e);
  }

  if (!liveCost) {
    liveCost = FALLBACK_COST[service] || 0.35;
    source = "fallback";
  }

  // SAME AS BUY ROUTE - MUST MATCH
  let finalPrice = Math.ceil((liveCost * NAIRA * PROFIT) / 50) * 50;
  if (finalPrice < 300) finalPrice = 300; // FIXED: was 200, now 300 to match buy

  return NextResponse.json({
    price: finalPrice,
    liveCostDollar: liveCost,
    cheapestOperator,
    profit: PROFIT,
    rate: NAIRA,
    source,
    service,
    country: fiveCountry
  });
}
