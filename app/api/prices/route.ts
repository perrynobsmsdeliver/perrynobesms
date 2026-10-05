import { NextResponse } from "next/server";

const KEY = process.env.FIVESIM_API_KEY!;
const MAP: any = {
  us: "usa", gb: "england", ca: "canada", ng: "nigeria",
  gh: "ghana", za: "southafrica", de: "germany", fr: "france",
  au: "australia", in: "india", id: "indonesia", tr: "turkey",
  ru: "russia", br: "brazil"
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const service = (searchParams.get("service") || "whatsapp").toLowerCase();
    const country = (searchParams.get("country") || "us").toLowerCase();
    const fiveCountry = MAP[country] || country;

    const res = await fetch("https://5sim.net/v1/guest/prices", {
      headers: { Authorization: `Bearer ${KEY}`, Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: "5sim error", status: res.status, body: txt.slice(0,300) }, {status:500});
    }

    const json = await res.json();

    // REAL STRUCTURE: service -> country -> {cost, count}
    // Example: json.whatsapp.usa.cost = 0.18
    let costDollar = json?.[service]?.[fiveCountry]?.cost
                  || json?.[service]?.[country]?.cost
                  || json?.[fiveCountry]?.[service]?.cost;

    // Try find anyway - loop if keys case different
    if (!costDollar) {
      const svcKey = Object.keys(json).find(k => k.toLowerCase() === service);
      if (svcKey) {
        const countryObj = json[svcKey];
        const cKey = Object.keys(countryObj).find(k => k.toLowerCase() === fiveCountry || k.toLowerCase() === country);
        if (cKey) costDollar = countryObj[cKey]?.cost;
      }
    }

    if (!costDollar) {
      // debug: return what we have
      return NextResponse.json({
        error: "NOT_FOUND",
        tried: { service, fiveCountry, country },
        availableServices: Object.keys(json).slice(0,10),
        sample: json[service]? Object.keys(json[service]).slice(0,10) : "no service key"
      }, {status:404});
    }

    const finalPrice = Math.ceil((costDollar * 1600 * 5) / 50) * 50;

    return NextResponse.json({
      price: finalPrice,
      liveCostDollar: costDollar,
      country: fiveCountry,
      service
    });

  } catch (e:any) {
    return NextResponse.json({ error: e.message }, {status:500});
  }
}
