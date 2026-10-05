import { NextResponse } from "next/server";

const FIVE_SIM_KEY = process.env.FIVESIM_API_KEY!;
const COUNTRY_MAP:any = { us:"usa", gb:"england", ca:"canada", za:"southafrica", gh:"ghana", de:"germany", fr:"france", at:"austria", au:"australia", nl:"netherlands", se:"sweden", pl:"poland", in:"india", id:"indonesia", br:"brazil", ru:"russia", tr:"turkey" }

export async function GET(req:Request){
  const {searchParams} = new URL(req.url);
  const service = searchParams.get("service") || "apple";
  const country = searchParams.get("country") || "us";
  const fiveCountry = COUNTRY_MAP[country] || country;

  const res = await fetch("https://5sim.net/v1/guest/prices", {
    headers: { Authorization: `Bearer ${FIVE_SIM_KEY}` },
    cache: "no-store"
  });
  const data = await res.json();
  const costDollar = data[service]?.[fiveCountry]?.cost || 0.13;
  const price = Math.ceil((costDollar * 1600 * 5)/50)*50; // x5 LOCKED

  return NextResponse.json({ price });
}
