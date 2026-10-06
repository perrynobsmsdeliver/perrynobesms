import { NextResponse } from "next/server";

const COUNTRY_MAP:any = {
  us:"usa", gb:"england", ca:"canada", za:"southafrica",
  de:"germany", fr:"france", gh:"ghana", ng:"nigeria",
  in:"india", ru:"russia", tr:"turkey", br:"brazil",
  au:"australia", nl:"netherlands", se:"sweden", pl:"poland", id:"indonesia"
}

const SERVICES = ["whatsapp","telegram","facebook","tiktok","google","instagram","twitter","discord","openai","microsoft"];

export async function GET(req: Request){
  const { searchParams } = new URL(req.url);
  const filterCountry = searchParams.get("country"); // optional?country=us

  const NAIRA = Number(process.env.USD_TO_NGN || 1600);
  const countries = filterCountry? [filterCountry.toLowerCase()] : Object.keys(COUNTRY_MAP);

  let all:any = {};

  for(const c of countries){
    const fiveCountry = COUNTRY_MAP[c] || c;
    all[c] = {};
    for(const svc of SERVICES){
      try{
        const res = await fetch(`https://5sim.net/v1/guest/prices?country=${fiveCountry}&product=${svc}`, {cache:"no-store"});
        const data = await res.json();
        const serviceData = data[fiveCountry]?.[svc] || {};

        let cheapest = Infinity;
        let cheapestOp = "";
        for(const [op, val] of Object.entries(serviceData as any)){
          const cost = (val as any).cost || 0;
          const count = (val as any).count || 0;
          if(cost>0 && count>0 && cost<cheapest){
            cheapest=cost;
            cheapestOp=op;
          }
        }

        if(cheapest!==Infinity){
          all[c][svc] = {
            usd: cheapest,
            op: cheapestOp,
            ngn: Math.ceil((cheapest * NAIRA * 1.5)/50)*50
          };
        } else {
          all[c][svc] = null;
        }
      }catch{
        all[c][svc] = null;
      }
    }
  }

  return NextResponse.json({rate: NAIRA, markup: 1.5, prices: all});
}
