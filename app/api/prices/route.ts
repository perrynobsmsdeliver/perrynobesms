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
  const PROFIT = 1.5; // ALWAYS x1.5 as you want

  let liveCost = 0;
  let cheapestOperator = "any";
  let source = "fallback";

  try {
    const r = await fetch(`https://5sim.net/v1/guest/prices?country=${fiveCountry}&product=${service}`, { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      // j = { "usa": { "whatsapp": { "any": 0.22, "virtual15": 0.3 } } }
      const countryData = j[fiveCountry] || j[fiveCountry.toLowerCase()] || j[country] || {};
      const serviceData = countryData[service];

      if (serviceData && typeof serviceData === 'object') {
        // Find cheapest operator
        let min = Infinity;
        for (const [op, val] of Object.entries(serviceData as any)) {
          const price = typeof val === 'number'? val : (val as any).cost || (val as any).price || 0;
          if (price > 0 && price < min) {
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

  // Fallback to authenticated endpoint if guest fails
  if (!liveCost && process.env.FIVESIM_API_KEY) {
    try {
      const r2 = await fetch(`https://5sim.net/v1/guest/products/${fiveCountry}/any`, {
        headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}` },
        cache: "no-store"
      });
      if (r2.ok) {
        const j2 = await r2.json();
        // j2 = { "whatsapp": { "Price": 0.25 } } or similar
        if (j2[service]?.Price) {
          liveCost = j2[service].Price;
          source = "live-product";
        }
      }
    } catch {}
  }

  if (!liveCost) {
    liveCost = FALLBACK_COST[service] || 0.35;
    source = "fallback";
  }

  // Your rule: cheapest x 1.5 x rate, rounded to 50
  let finalPrice = Math.ceil((liveCost * NAIRA * PROFIT) / 50) * 50;
  if (finalPrice < 200) finalPrice = 200; // min price

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
