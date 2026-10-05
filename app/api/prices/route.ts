import { NextResponse } from "next/server";
const KEY = process.env.FIVESIM_API_KEY!;
const MAP:any = { us:"usa", gb:"england", ca:"canada", gh:"ghana", za:"southafrica", de:"germany", fr:"france", at:"austria", au:"australia", nl:"netherlands", se:"sweden", pl:"poland", in:"india", id:"indonesia", br:"brazil", ru:"russia", tr:"turkey", ng:"nigeria" };

export async function GET(req:Request){
  const {searchParams} = new URL(req.url);
  const service = searchParams.get("service")!;
  const country = searchParams.get("country")!;
  const fiveCountry = MAP[country] || country;
  const res = await fetch("https://5sim.net/v1/guest/prices", { headers:{Authorization:`Bearer ${KEY}`}, cache:"no-store" });
  const data = await res.json();
  const cost = data?.[fiveCountry]?.[service]?.cost || data?.[service]?.[fiveCountry]?.cost || 0.13;
  const price = Math.ceil((cost * 1600 * 5)/50)*50;
  return NextResponse.json({price});
}
