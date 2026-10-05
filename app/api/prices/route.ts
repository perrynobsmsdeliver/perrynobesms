import { NextResponse } from "next/server";

const COUNTRY_MAP: any = {
  us: "usa", gb: "england", ca: "canada", gh: "ghana", za: "southafrica",
  de: "germany", fr: "france", at: "austria", au: "australia", nl: "netherlands",
  se: "sweden", pl: "poland", in: "india", id: "indonesia", br: "brazil",
  ru: "russia", tr: "turkey", ng: "nigeria"
};

// Your settings
const NAIRA_RATE = 1600; // $1 = ₦1600
const PROFIT_X = 1.5; // x1.5 profit as you requested

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const service = (searchParams.get("service") || "whatsapp").toLowerCase();
  const country = (searchParams.get("country") || "us").toLowerCase();
  const fiveCountry = COUNTRY_MAP[country] || country;

  try {
    const key = process.env.FIVESIM_API_KEY!;
    if (!key) throw new Error("No API KEY");

    // 1. Get LIVE price from your 5sim account
    const url = `https://5sim.net/v1/guest/prices?product=${service}`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    let liveCost = data?.[fiveCountry]?.cost?? 0;

    // If guest is empty, try user prices with your key (more accurate)
    if (!liveCost || liveCost === 0) {
      const res2 = await fetch(`https://5sim.net/v1/user/prices?product=${service}`, {
        headers: { Authorization: `Bearer ${key}` },
        cache: "no-store"
      });
      const data2 = await res2.json();
      // user prices can be in different formats
      liveCost = data2?.[fiveCountry]?.cost
             ?? data2?.Price?.[fiveCountry]?.cost
             ?? data2?.[service]?.[fiveCountry]?.cost
             ?? 0;
    }

    if (!liveCost || liveCost === 0) {
      // If 5sim itself has no number for that country, return 0 so user sees "Out of stock"
      return NextResponse.json({
        price: 0,
        liveCostDollar: 0,
        service,
        country: fiveCountry,
        message: "No live number available for this country"
      });
    }

    // 2. Your formula: LIVE $ * 1600 * 1.5
    let finalPrice = liveCost * NAIRA_RATE * PROFIT_X;
    finalPrice = Math.ceil(finalPrice / 50) * 50; // round to ₦50

    // Optional small minimum so you don't sell at loss
    if (finalPrice < 500) finalPrice = 500;

    return NextResponse.json({
      price: finalPrice,
      liveCostDollar: liveCost,
      country: fiveCountry,
      service: service,
      rate: NAIRA_RATE,
      profit: PROFIT_X,
      live: true
    });

  } catch (e: any) {
    return NextResponse.json({
      price: 0,
      liveCostDollar: 0,
      error: e.message,
      fallback: false
    });
  }
}
