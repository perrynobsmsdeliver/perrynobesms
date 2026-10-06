import { NextResponse } from "next/server";

const COUNTRY_MAP:any = {
  us:"usa", gb:"england", ca:"canada", za:"southafrica",
  de:"germany", fr:"france", gh:"ghana", ng:"nigeria",
  in:"india", ru:"russia", tr:"turkey", br:"brazil",
  au:"australia", nl:"netherlands", se:"sweden"
}

export async function GET(){
  const NAIRA = Number(process.env.USD_TO_NGN || 1600);
  const SERVICES = ["whatsapp","telegram","facebook","tiktok","google","instagram","twitter","discord"];
  const COUNTRIES = ["us","gb","ca","de","fr","au","ru","tr","in","gh","za","ng","br"];

  let all:any = {};

  for(const c of COUNTRIES){
    const fiveCountry = COUNTRY_MAP[c];
    all[c] = {};
    for(const svc of SERVICES){
      try{
        const res = await fetch(`https://5sim.net/v1/guest/prices?country=${fiveCountry}&product=${svc}`, {cache:"no-store"});
        const data = await res.json();
        const serviceData = data[fiveCountry]?.[svc] || {};
        let cheapest = Infinity;
        for(const val of Object.values(serviceData as any)){
          const price = typeof val==='number'? val : (val as any).cost || (val as any).price || 0;
          if(price>0 && price<cheapest) cheapest=price;
        }
        if(cheapest!==Infinity){
          all[c][svc] = Math.ceil((cheapest * NAIRA * 1.5)/50)*50;
        } else {
          all[c][svc] = null; // no stock
        }
      }catch{
        all[c][svc] = null;
      }
    }
  }

  return NextResponse.json({rate: NAIRA, markup: 1.5, prices: all});
}
