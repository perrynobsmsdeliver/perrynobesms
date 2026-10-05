import { NextResponse } from "next/server";
const KEY = process.env.FIVESIM_API_KEY!;
const MAP:any = {
  us:"usa", gb:"england", ca:"canada", gh:"ghana", za:"southafrica",
  de:"germany", fr:"france", at:"austria", au:"australia", nl:"netherlands",
  se:"sweden", pl:"poland", in:"india", id:"indonesia", br:"brazil",
  ru:"russia", tr:"turkey", ua:"ukraine", ng:"nigeria"
};

export async function GET(req:Request){
  const {searchParams}=new URL(req.url);
  const service=searchParams.get("service")||"whatsapp";
  const country=searchParams.get("country")||"us";
  const fiveCountry=MAP[country]||country;
  try{
    const res=await fetch("https://5sim.net/v1/guest/prices",{headers:{Authorization:`Bearer ${KEY}`},cache:"no-store"});
    const j=await res.json();
    let cost=j?.[service]?.[fiveCountry]?.cost || j?.[service]?.[country]?.cost;
    if(!cost){
      // try case-insensitive search
      const sKey=Object.keys(j).find(k=>k.toLowerCase()===service);
      if(sKey){ const cObj=j[sKey]; const cKey=Object.keys(cObj).find(k=>k.toLowerCase()===fiveCountry||k.toLowerCase()===country); if(cKey) cost=cObj[cKey]?.cost; }
    }
    if(!cost) return NextResponse.json({price:0,error:"not found",tried:fiveCountry,service,available:Object.keys(j[service]||{}).slice(0,20)},{status:200});
    const finalPrice=Math.ceil((cost*1600*5)/50)*50;
    return NextResponse.json({price:finalPrice,liveCostDollar:cost,country:fiveCountry,service});
  }catch(e:any){ return NextResponse.json({price:0,error:e.message},{status:500}); }
}
