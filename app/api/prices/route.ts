import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const MARGIN = 10;
const RATE = 1600;

const COUNTRY_MAP: any = {
  ng:"nigeria", gh:"ghana", us:"usa", gb:"england", ca:"canada",
  au:"australia", de:"germany", fr:"france", za:"southafrica", ke:"kenya",
  in:"india", id:"indonesia", ph:"philippines", my:"malaysia", sg:"singapore",
  ae:"uae", tr:"turkey", ru:"russia", ua:"ukraine"
};

const FALLBACK_DOLLAR: any = {
  whatsapp: 0.134, telegram: 0.11, facebook: 0.07, tiktok: 0.15, google: 0.04
};

export async function GET(req: NextRequest){
  const key = process.env.FIVESIM_API_KEY!;
  if(!key) return NextResponse.json({ price: 2500 });

  const { searchParams } = new URL(req.url);
  const service = searchParams.get("service") || "whatsapp";
  const country = searchParams.get("country") || "ng";
  const fiveCountry = COUNTRY_MAP[country] || country;

  try{
    const res = await fetch("https://5sim.net/v1/guest/prices?product=any", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store"
    });
    const data = await res.json();
    // data structure: { nigeria: { whatsapp: { cost: 0.15 } } }
    const costDollar = data?.[fiveCountry]?.[service]?.cost;
    if(costDollar){
      const costNaira = costDollar * RATE;
      const finalPrice = Math.ceil((costNaira * MARGIN) / 50) * 50;
      return NextResponse.json({ price: finalPrice });
    }
  }catch(e){}

  // Fallback - customer only sees final price
  const fallbackCost = FALLBACK_DOLLAR[service] || 0.13;
  const finalPrice = Math.ceil((fallbackCost * RATE * MARGIN) / 50) * 50;
  return NextResponse.json({ price: finalPrice });
}
