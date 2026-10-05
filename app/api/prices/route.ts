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
    const res=await fetch(`https://5sim.net/v1/guest/products/${fiveCountry}/any`,{cache:"no-store"});
    if(!res.ok) return NextResponse.json({price:1200, fallback:true});
    const json=await res.json();
    let costs:number[] = [];
    if(Array.isArray(json)){
      json.forEach((p:any)=>{
        if((p.product||p.name||p.service||"").toLowerCase()===service){
          const c = p.Price||p.price||p.Cost||p.cost||0;
          if(c>0) costs.push(Number(c));
        }
      });
    } else {
      Object.values(json).forEach((v:any)=>{
        if(!v) return;
        // direct product match
        if(typeof v === 'object'){
          // check if this object itself is price for service
          const prodName = (v.Product||v.product||v.service||"").toLowerCase();
          if(prodName===service || prodName===""){
            const c = v.Price||v.price||v.Cost||v.cost||0;
            if(c>0) costs.push(Number(c));
          }
          // also check nested operators
          Object.values(v).forEach((op:any)=>{
            if(op && typeof op === 'object'){
              const c = op.Price||op.price||op.Cost||op.cost||0;
              if(c>0) costs.push(Number(c));
            }
          });
        }
      });
      const key = Object.keys(json).find(k=>k.toLowerCase()===service);
      if(key){
        const c = (json as any)[key]?.Price || (json as any)[key]?.Cost || 0;
        if(c>0) costs.push(Number(c));
      }
    }
    if(costs.length===0) return NextResponse.json({price:1200, fallback:true});
    const cheapest = Math.min(...costs); // CHEAPEST ONLY
    let finalPrice = cheapest * 1600 * 3; // X3
    finalPrice = Math.ceil(finalPrice/50)*50;
    if(finalPrice < 1200) finalPrice = 1200;
    return NextResponse.json({price:finalPrice, liveCostDollar:cheapest, cheapest, allFound:costs.length});
  }catch(e:any){
    return NextResponse.json({price:1200, error:e.message});
  }
}
