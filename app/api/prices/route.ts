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
    // CORRECT 5sim endpoint - products by country
    const res = await fetch(`https://5sim.net/v1/guest/products/${fiveCountry}/any`, {
      cache: "no-store",
      headers: { Accept: "application/json" }
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ price: 0, error: `5sim ${res.status}`, body: txt.slice(0,200), country: fiveCountry });
    }

    const json = await res.json();
    // json is like { "whatsapp": { Cost: 0.18, Count: 100 }, "telegram": {...} } OR array
    let cost = 0;

    if (Array.isArray(json)) {
      const found = json.find((p: any) => (p.product || p.name || p.service || "").toLowerCase() === service);
      cost = found?.Price || found?.cost || found?.Cost || 0;
    } else {
      // object case
      const key = Object.keys(json).find(k => k.toLowerCase() === service);
      if (key) {
        cost = json[key]?.Price || json[key]?.price || json[key]?.Cost || json[key]?.cost || 0;
      }
    }

    if (!cost || cost === 0) {
      // fallback: if product not found, use average
      return NextResponse.json({
        price: 0,
        error: "not found",
        tried: fiveCountry,
        service,
        available: Object.keys(json).slice(0, 20),
        rawSample: JSON.stringify(json).slice(0, 500)
      });
    }

    const finalPrice = Math.ceil((cost * 1600 * 5) / 50) * 50;

    return NextResponse.json({
      price: finalPrice,
      liveCostDollar: cost,
      country: fiveCountry,
      service
    });

  } catch (e: any) {
    return NextResponse.json({ price: 0, error: e.message });
  }
}
