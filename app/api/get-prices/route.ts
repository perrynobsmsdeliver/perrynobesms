import { NextResponse } from "next/server";

const COUNTRY_MAP:any = {
  us:"usa", gb:"england", ca:"canada", za:"southafrica",
  de:"germany", fr:"france", gh:"ghana", ng:"nigeria",
  in:"india", ru:"russia", tr:"turkey", br:"brazil",
  au:"australia", nl:"netherlands", se:"sweden", pl:"poland", id:"indonesia"
}

export async function POST(req:Request){
  try{
    const {service, country} = await req.json();
    if(!service ||!country) return NextResponse.json({error:"Missing service/country"}, {status:400});

    const fiveCountry = COUNTRY_MAP[country.toLowerCase()] || country.toLowerCase();
    const svc = service.toLowerCase();
    const NAIRA = Number(process.env.USD_TO_NGN || 1600);

    // Live 5sim guest prices - no auth needed
    const res = await fetch(`https://5sim.net/v1/guest/prices?country=${fiveCountry}&product=${svc}`, { cache: "no-store" });
    if(!res.ok) throw new Error("5sim fetch failed");
    const data = await res.json();

    // data shape: { usa: { whatsapp: { any: {cost:0.22, count:5}... } } OR { any: 0.22 }
    const countryData = data[fiveCountry] || {};
    const serviceData = countryData[svc] || {};

    let cheapest = Infinity;
    let cheapestOperator = "any";

    for(const [operator, val] of Object.entries(serviceData as any)){
      let price = 0;
      if(typeof val === 'number') price = val;
      else if((val as any).cost) price = (val as any).cost;
      else if((val as any).Price) price = (val as any).Price;
      else if((val as any).price) price = (val as any).price;

      if(price > 0 && price < cheapest){
        cheapest = price;
        cheapestOperator = operator;
      }
    }

    // If no stock, fallback
    if(cheapest === Infinity){
      cheapest = svc === "whatsapp"? 0.35 : 0.15;
      cheapestOperator = "fallback";
    }

    const sellPrice = Math.ceil((cheapest * NAIRA * 1.5) / 50) * 50;

    return NextResponse.json({
      service: svc,
      country: fiveCountry,
      operator: cheapestOperator,
      base_usd: cheapest,
      rate: NAIRA,
      markup: 1.5,
      price: sellPrice
    });

  } catch(e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}
