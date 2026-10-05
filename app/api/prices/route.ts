import { NextResponse } from "next/server";

const MAP:any = {
  us:"usa", gb:"england", ca:"canada", gh:"ghana", za:"southafrica",
  de:"germany", fr:"france", at:"austria", au:"australia", nl:"netherlands",
  se:"sweden", pl:"poland", in:"india", id:"indonesia", br:"brazil", ru:"russia", tr:"turkey"
};

const RATE = 1600;
const PROFIT = 1.8;

export async function GET(req:Request){
  const {searchParams}=new URL(req.url);
  const service=(searchParams.get("service")||"whatsapp").toLowerCase();
  const country=(searchParams.get("country")||"us").toLowerCase();
  const fiveCountry=MAP[country]||country;
  const key=process.env.FIVESIM_API_KEY!;

  try{
    // CORRECT ENDPOINT FOR ALL SERVICES
    const res = await fetch(`https://5sim.net/v1/guest/prices?product=${service}`,{ cache:"no-store" });
    const data = await res.json();

    let liveCost = data?.[fiveCountry]?.cost?? data?.[fiveCountry]?.Cost?? 0;

    // Backup: try with API key if guest fails
    if(!liveCost){
      const res2 = await fetch(`https://5sim.net/v1/user/prices?product=${service}`,{
        headers:{ Authorization:`Bearer ${key}` }, cache:"no-store"
      });
      const data2 = await res2.json();
      liveCost = data2?.[fiveCountry]?.cost?? data2?.Price?.[fiveCountry]?.cost?? 0;
    }

    if(!liveCost){
      const FALLBACK:any = { whatsapp:0.85, signal:0.04, telegram:0.12, facebook:0.08, tiktok:0.15, google:0.15 };
      liveCost = FALLBACK[service] || 0.35;
    }

    let finalPrice = liveCost * RATE * PROFIT;
    finalPrice = Math.ceil(finalPrice / 50) * 50;
    if(finalPrice < 1200) finalPrice = 1200;

    return NextResponse.json({ price:finalPrice, liveCostDollar:liveCost, country:fiveCountry, service });

  }catch(e:any){
    return NextResponse.json({ price:1200, liveCostDollar:0, error:e.message });
  }
}
