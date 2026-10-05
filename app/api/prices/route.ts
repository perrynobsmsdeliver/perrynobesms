import { NextResponse } from "next/server";

const KEY = process.env.FIVESIM_API_KEY!;

const MAP: any = {
  us: "usa", gb: "england", ca: "canada", ng: "nigeria",
  gh: "ghana", za: "southafrica", ke: "kenya", de: "germany",
  fr: "france", au: "australia", in: "india", id: "indonesia",
  tr: "turkey", ru: "russia", br: "brazil", nl: "netherlands",
  se: "sweden", pl: "poland", ua: "ukraine", ae: "uae"
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const service = searchParams.get("service") || "whatsapp";
  const country = searchParams.get("country") || "us";

  const fiveCountry = MAP[country] || country;

  const res = await fetch("https://5sim.net/v1/guest/prices", {
    headers: { Authorization: `Bearer ${KEY}` },
    cache: "no-store",
  });
  const json = await res.json();

  // LIVE PRICE FROM 5SIM - country first, service second
  let costDollar = json?.[fiveCountry]?.[service]?.cost;

  // if not found, try opposite (some old API)
  if (!costDollar) {
    costDollar = json?.[service]?.[fiveCountry]?.cost;
  }

  // if still not found, we KNOW it's missing, not 0.13
  if (!costDollar) {
    console.log("NOT FOUND:", fiveCountry, service);
    costDollar = 0.13; // only for debug
  }

  // THIS IS YOUR TIMES 5 - LIVE * 5
  const liveTimesFive = costDollar * 1600 * 5;
  const finalPrice = Math.ceil(liveTimesFive / 50) * 50;

  return NextResponse.json({
    price: finalPrice,
    liveCostDollar: costDollar,
    country: fiveCountry,
    service: service
  });
}
