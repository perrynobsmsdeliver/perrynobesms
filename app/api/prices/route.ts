import { NextResponse } from "next/server";

const COUNTRY_MAP: any = {
  us: "usa", gb: "england", ca: "canada", gh: "ghana", za: "southafrica",
  de: "germany", fr: "france", at: "austria", au: "australia", nl: "netherlands",
  se: "sweden", pl: "poland", in: "india", id: "indonesia", br: "brazil",
  ru: "russia", tr: "turkey", ng: "nigeria"
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const service = (searchParams.get("service") || "whatsapp").toLowerCase();
  const country = (searchParams.get("country") || "us").toLowerCase();
  const fiveCountry = COUNTRY_MAP[country] || country;
  const NAIRA = 1600;
  const PROFIT = 1.8;

  try {
    const key = process.env.FIVESIM_API_KEY!;
    const url = `https://5sim.net/v1/guest/prices?product=${service}`;
    const r = await fetch(url, { cache: "no-store" });
    const data = await r.json();
    let live = data?.[fiveCountry]?.cost?? 0;

    if (!live) {
      const r2 = await fetch(`https://5sim.net/v1/user/prices?product=${service}`, {
        headers: { Authorization: `Bearer ${key}` },
        cache: "no-store"
      });
      const d2 = await r2.json();
      live = d2?.[fiveCountry]?.cost?? d2?.Price?.[fiveCountry]?.cost?? 0;
    }

    // NO MORE FALLBACK 1200 — if no live, return 0
    if (!live) {
      return NextResponse.json({ price: 0, liveCostDollar: 0, service, country: fiveCountry, error: "Out of stock" });
    }

    let finalPrice = Math.ceil((live * NAIRA * PROFIT)/50)*50;

    return NextResponse.json({ price: finalPrice, liveCostDollar: live, service, country: fiveCountry, live: true });

  } catch (e: any) {
    return NextResponse.json({ price: 0, liveCostDollar: 0, error: e.message });
  }
}
