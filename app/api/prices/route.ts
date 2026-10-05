import { NextResponse } from "next/server";

const COUNTRY_MAP: any = {
  us: "usa", gb: "england", ca: "canada", gh: "ghana", za: "southafrica",
  de: "germany", fr: "france", at: "austria", au: "australia",
  nl: "netherlands", se: "sweden", pl: "poland", in: "india",
  id: "indonesia", br: "brazil", ru: "russia", tr: "turkey", ng: "nigeria",
  ke: "kenya", ua: "ukraine", kz: "kazakhstan", es: "spain", it: "italy"
};

const NAIRA_RATE = 1600; // $1 = ₦1600 — change anytime
const PROFIT = 1.5; // Your x1.5 profit

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const service = (searchParams.get("service") || "whatsapp").toLowerCase();
  const country = (searchParams.get("country") || "us").toLowerCase();
  const fiveCountry = COUNTRY_MAP[country] || country;

  try {
    const key = process.env.FIVESIM_API_KEY!;

    // Fetch LIVE from 5sim directly
    const guestRes = await fetch(`https://5sim.net/v1/guest/prices?product=${service}`, { cache: "no-store" });
    const guestData = await guestRes.json();
    let liveCost = guestData?.[fiveCountry]?.cost?? 0;

    // If guest empty, try with your API key (more accurate & shows stock)
    if (!liveCost) {
      const userRes = await fetch(`https://5sim.net/v1/user/prices?product=${service}`, {
        headers: { Authorization: `Bearer ${key}` },
        cache: "no-store"
      });
      const userData = await userRes.json();
      liveCost = userData?.[fiveCountry]?.cost?? userData?.Price?.[fiveCountry]?.cost?? 0;
    }

    if (!liveCost || liveCost === 0) {
      return NextResponse.json({ price: 0, liveCostDollar: 0, service, country: fiveCountry, outOfStock: true });
    }

    // YOUR FORMULA: 5sim $ * 1600 * 1.5
    const finalPrice = Math.ceil((liveCost * NAIRA_RATE * PROFIT) / 50) * 50;

    return NextResponse.json({
      price: finalPrice,
      liveCostDollar: liveCost,
      nairaRate: NAIRA_RATE,
      profit: PROFIT,
      service,
      country: fiveCountry,
      formula: `${liveCost} * ${NAIRA_RATE} * ${PROFIT} = ${finalPrice}`
    });

  } catch (e: any) {
    return NextResponse.json({ price: 0, error: e.message });
  }
}
