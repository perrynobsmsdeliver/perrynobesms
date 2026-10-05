import { NextResponse } from "next/server";
const FIVE_SIM_KEY = process.env.FIVESIM_API_KEY!;
const COUNTRY_MAP:any = { us:"usa", gb:"england", ca:"canada", za:"southafrica" }
export async function POST(req:Request){
  const {service, country} = await req.json();
  const fiveCountry = COUNTRY_MAP[country] || country;
  const res = await fetch("https://5sim.net/v1/guest/prices", {
    headers: { Authorization: `Bearer ${FIVE_SIM_KEY}` }, cache: "no-store"
  });
  const data = await res.json();
  const costDollar = data[service]?.[fiveCountry]?.cost || 0.13;
  const sellPrice = Math.ceil((costDollar * 1600 * 5)/50)*50;
  return NextResponse.json({price: sellPrice});
}
