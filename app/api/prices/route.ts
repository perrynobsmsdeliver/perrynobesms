import { NextResponse } from "next/server";

const MAP:any = {
  us:"usa", gb:"england", ca:"canada", gh:"ghana", za:"southafrica",
  de:"germany", fr:"france", at:"austria", au:"australia", nl:"netherlands",
  se:"sweden", pl:"poland", in:"india", id:"indonesia", br:"brazil",
  ru:"russia", tr:"turkey"
};

const PROFIT_X = 1.8; // LAUNCH PROFIT
const NAIRA_RATE = 1600;

export async function GET(req:Request){
  const {searchParams}=new URL(req.url);
  const service=(searchParams.get("service")||"whatsapp").toLowerCase();
  const country=(searchParams.get("country")||"us").toLowerCase();
  const fiveCountry=MAP[country]||country;
  const key = process.env.FIVESIM_API_KEY!;

  try{
    const res = await fetch("https://5sim.net/v1/guest/prices", {
      headers:{ Authorization: `Bearer ${key}` },
      cache:"no-store"
    });
    const data = await res.json();
    let cost = data?.[fiveCountry]?.[service]?.cost || data?.[fiveCountry]?.[service]?.Cost || 0;

    if(!cost){
      const FALLBACK:any = { whatsapp:0.85, telegram:0.25, facebook:0.15, tiktok:0.2 };
      cost = FALLBACK[service] || 0.26;
    }

    let finalPrice = cost * NAIRA_RATE * PROFIT_X;
    finalPrice = Math.ceil(finalPrice / 50) * 50;
    if(finalPrice < 1200) finalPrice = 1200;

    return NextResponse.json({ price: finalPrice, liveCostDollar: cost });
  }catch(e:any){
    return NextResponse.json({ price: 2450, error: e.message });
  }
}
