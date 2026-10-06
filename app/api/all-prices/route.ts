import { NextResponse } from "next/server";

const COUNTRY_MAP:any = {
  us:"usa", gb:"england", ca:"canada", za:"southafrica",
  de:"germany", fr:"france", gh:"ghana", ng:"nigeria",
  in:"india", ru:"russia", tr:"turkey", br:"brazil",
  au:"australia", nl:"netherlands", se:"sweden", pl:"poland"
}

export async function GET(req: Request){
  const { searchParams } = new URL(req.url);
  const oneCountry = searchParams.get("country") || "us";
  const NAIRA = Number(process.env.USD_TO_NGN || 1600);
  
  const fiveCountry = COUNTRY_MAP[oneCountry.toLowerCase()] || oneCountry.toLowerCase();
  const svc = (searchParams.get("service") || "whatsapp").toLowerCase();

  const res = await fetch(`https://5sim.net/v1/guest/prices?country=${fiveCountry}&product=${svc}`, { cache: "no-store" });
  const data = await res.json();

  // DEBUG - see real shape
  return NextResponse.json({
    debug_country: fiveCountry,
    debug_service: svc,
    raw_5sim_response: data,
    rate: NAIRA
  });
}
