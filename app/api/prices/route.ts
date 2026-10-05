import { NextResponse } from "next/server";

const COUNTRY_MAP: any = {
  us: "usa", gb: "england", ca: "canada", gh: "ghana", za: "southafrica",
  de: "germany", fr: "france", at: "austria", au: "australia", nl: "netherlands",
  se: "sweden", pl: "poland", in: "india", id: "indonesia", br: "brazil",
  ru: "russia", tr: "turkey", ng: "nigeria"
};

const NAIRA_RATE = 1600;
const PROFIT_X = 1.8;

const FALLBACK: any = {
  whatsapp: 0.85,
  signal: 0.04,
  telegram: 0.12,
  facebook: 0.08,
  tiktok: 0.12,
  google: 0.15,
  discord: 0.08,
  viber: 0.07
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const service = (searchParams.get("service") || "whatsapp").toLowerCase();
  const country = (searchParams.get("country") || "us").toLowerCase();
  const fiveCountry = COUNTRY_MAP[country] || country;

  try {
    // CORRECT ENDPOINT: guest/prices?product=service
    const url = `https://5sim.net/v1/guest/prices?product=${service}`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    let liveCost = data?.[fiveCountry]?.cost?? data?.[fiveCountry]?.Cost?? 0;

    // Try with API key if guest returns 0
    if (!liveCost) {
      const key = process.env.FIVESIM_API_KEY!;
      const res2 = await fetch(`https://5sim.net/v1/user/prices?product=${service}`, {
        headers: { Authorization: `Bearer ${key}` },
        cache: "no-store"
      });
      const data2 = await res2.json();
      liveCost = data2?.[fiveCountry]?.cost?? data2?.Price?.[fiveCountry]?.cost?? 0;
    }

    if (!liveCost || liveCost === 0) {
      liveCost = FALLBACK[service] || 0.35;
    }

    let finalPrice = liveCost * NAIRA_RATE * PROFIT_X;
    finalPrice = Math.ceil(finalPrice / 50) * 50;

    // Different minimums so WhatsApp is NOT 1200
    if (service === "whatsapp") {
      if (finalPrice < 2000) finalPrice = 2000;
    } else if (service === "signal" || service === "telegram") {
      if (finalPrice < 1200) finalPrice = 1200;
    } else {
      if (finalPrice < 1200) finalPrice = 1200;
    }

    return NextResponse.json({
      price: finalPrice,
      liveCostDollar: liveCost,
      country: fiveCountry,
      service: service,
      rate: NAIRA_RATE,
      profit: PROFIT_X
    });

  } catch (e: any) {
    const liveCost = FALLBACK[service] || 0.35;
    let finalPrice = liveCost * NAIRA_RATE * PROFIT_X;
    finalPrice = Math.ceil(finalPrice / 50) * 50;
    if (finalPrice < 1200) finalPrice = 1200;
    if (service === "whatsapp" && finalPrice < 2000) finalPrice = 2000;

    return NextResponse.json({
      price: finalPrice,
      liveCostDollar: liveCost,
      fallback: true,
      error: e.message
    });
  }
}
