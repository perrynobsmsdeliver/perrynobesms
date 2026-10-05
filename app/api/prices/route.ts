import { NextResponse } from "next/server";

const MAP: any = {
  us: "usa", gb: "england", ca: "canada", gh: "ghana", za: "southafrica",
  de: "germany", fr: "france", at: "austria", au: "australia", nl: "netherlands",
  se: "sweden", pl: "poland", in: "india", id: "indonesia", br: "brazil",
  ru: "russia", tr: "turkey"
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const service = (searchParams.get("service") || "whatsapp").toLowerCase();
  const country = (searchParams.get("country") || "us").toLowerCase();
  const fiveCountry = MAP[country] || country;

  try {
    const res = await fetch(`https://5sim.net/v1/guest/products/${fiveCountry}/any`, {
      cache: "no-store",
      headers: { Accept: "application/json" }
    });

    if (!res.ok) {
      return NextResponse.json({ price: 1200, error: `5sim ${res.status}`, country: fiveCountry });
    }

    const json = await res.json();
    let cost = 0;

    if (Array.isArray(json)) {
      const found = json.find((p: any) => (p.product || p.name || p.service || "").toLowerCase() === service);
      cost = found?.Price || found?.cost || found?.Cost || 0;
    } else {
      const key = Object.keys(json).find(k => k.toLowerCase() === service);
      if (key) {
        cost = json[key]?.Price || json[key]?.price || json[key]?.Cost || json[key]?.cost || 0;
      }
    }

    if (!cost) {
      return NextResponse.json({ price: 1200, country: fiveCountry, service, fallback: true });
    }

    // X3 - HIDDEN FROM CUSTOMER
    let finalPrice = cost * 1600 * 3;
    finalPrice = Math.ceil(finalPrice / 50) * 50;
    if (finalPrice < 1200) finalPrice = 1200;

    return NextResponse.json({
      price: finalPrice,
      liveCostDollar: cost,
      country: fiveCountry,
      service
    });

  } catch (e: any) {
    return NextResponse.json({ price: 1200, error: e.message });
  }
}
