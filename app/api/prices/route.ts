import { NextResponse } from "next/server";
const FIVE_SIM_KEY = process.env.FIVESIM_API_KEY!;
const NAIRA_RATE = 1600;
const PROFIT_X = 5;
const COUNTRY_MAP:any = {
  ng:"nigeria", gh:"ghana", us:"usa", gb:"england", ca:"canada",
  au:"australia", de:"germany", fr:"france", za:"southafrica", ke:"kenya",
  in:"india", id:"indonesia", ph:"philippines", my:"malaysia", sg:"singapore",
  ae:"uae", tr:"turkey", ru:"russia", ua:"ukraine", at:"austria",
  nl:"netherlands", se:"sweden", pl:"poland", br:"brazil"
};

export async function GET(req:Request){
  const {searchParams} = new URL(req.url);
  const service = searchParams.get("service") || "apple";
  const country = searchParams.get("country") || "us";
  const fiveCountry = COUNTRY_MAP[country] || country;
  try{
    const res = await fetch("https://5sim.net/v1/guest/prices", {
      headers:{ Authorization:`Bearer ${FIVE_SIM_KEY}` },
      cache:"no-store"
    });
    const data = await res.json();
    let costDollar = data?.[fiveCountry]?.[service]?.cost || data?.[service]?.[fiveCountry]?.cost || 0.13;
    const price = Math.ceil((costDollar * NAIRA_RATE * PROFIT_X)/50)*50;
    return NextResponse.json({ price });
  }catch{
    return NextResponse.json({ price: 1050 });
  }
}
