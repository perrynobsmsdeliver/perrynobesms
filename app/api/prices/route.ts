import { NextResponse } from "next/server";

const MAP:any = {
  us:"usa", gb:"england", ca:"canada", gh:"ghana", za:"southafrica",
  de:"germany", fr:"france", at:"austria", au:"australia", nl:"netherlands",
  se:"sweden", pl:"poland", in:"india", id:"indonesia", br:"brazil",
  ru:"russia", tr:"turkey"
};

export async function GET(req:Request){
  const {searchParams}=new URL(req.url);
  const service=(searchParams.get("service")||"whatsapp").toLowerCase();
  const country=(searchParams.get("country")||"us").toLowerCase();
  const fiveCountry=MAP[country]||country;

  try{
    // Use the products endpoint - more reliable
    const res = await fetch(`https://5sim.net/v1/guest/products/${fiveCountry}/any`,{
      cache:"no-store",
      headers:{Accept:"application/json"}
    });
    const json = await res.json();

    let cheapest = 0;

    // CASE 1: json is object like { whatsapp: { Cost: 0.26 } } or { whatsapp: { Virtual21: {Price:0.26} } }
    if(!Array.isArray(json)){
      // Direct
      if(json[service]?.Price) cheapest = json[service].Price;
      if(json[service]?.Cost) cheapest = json[service].Cost;
      if(json[service]?.cost) cheapest = json[service].cost;

      // If service contains operators
      if(json[service] && typeof json[service] === 'object'){
        let prices: number[] = [];
        Object.values(json[service]).forEach((v:any)=>{
          const c = v?.Price || v?.price || v?.Cost || v?.cost || 0;
          if(c>0) prices.push(Number(c));
        });
        if(prices.length>0) cheapest = Math.min(...prices);
      }

      // If still 0, scan whole json for cheapest that matches service name in product field
      if(!cheapest){
        let prices: number[] = [];
        Object.values(json).forEach((v:any)=>{
          if(v?.Product?.toLowerCase()===service || v?.product?.toLowerCase()===service){
            const c = v?.Price || v?.price || 0;
            if(c>0) prices.push(Number(c));
          }
        });
        if(prices.length>0) cheapest = Math.min(...prices);
      }
    }

    // CASE 2: array
    if(Array.isArray(json)){
      let prices: number[] = [];
      json.forEach((p:any)=>{
        if((p.product||p.Product||"").toLowerCase()===service){
          const c = p.Price||p.price||0;
          if(c>0) prices.push(Number(c));
        }
      });
      if(prices.length>0) cheapest = Math.min(...prices);
    }

    // If still nothing, fallback - but with real values per country
    if(!cheapest){
      const FALLBACK:any = { usa:0.26, england:0.55, germany:0.92, canada:0.3, ghana:0.18, southafrica:0.18, india:0.15, indonesia:0.15 };
      cheapest = FALLBACK[fiveCountry] || 0.26;
    }

    let finalPrice = cheapest * 1600 * 3; // X3
    finalPrice = Math.ceil(finalPrice / 50) * 50;
    if(finalPrice < 1200) finalPrice = 1200;

    return NextResponse.json({ price: finalPrice, liveCostDollar: cheapest, country: fiveCountry, service });

  }catch(e:any){
    return NextResponse.json({ price: 1200, error: e.message });
  }
}
