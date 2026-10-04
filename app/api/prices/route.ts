import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const MARGIN = 5; // LOCKED AT x5 SAME AS BUY-NUMBER
const RATE = 1600;

const COUNTRY_MAP: any = {
  gh:"ghana", us:"usa", gb:"england", ca:"canada",
  au:"australia", de:"germany", fr:"france", za:"southafrica", ke:"kenya",
  in:"india", id:"indonesia", ph:"philippines", my:"malaysia", sg:"singapore",
  ae:"uae", tr:"turkey", ru:"russia", ua:"ukraine",
  at:"austria", nl:"netherlands", se:"sweden", pl:"poland", br:"brazil",
  es:"spain"
};

const FALLBACK_DOLLAR: any = {
  whatsapp: 0.134, telegram: 0.11, facebook: 0.07, tiktok: 0.15, google: 0.04,
  instagram: 0.13, signal: 0.12, tumblr: 0.08, apple: 0.09, twitter: 0.10,
  discord: 0.11, amazon: 0.14, uber: 0.13, netflix: 0.15, microsoft: 0.08,
  yahoo: 0.07, snapchat: 0.12, linkedin: 0.09, openai: 0.16, paypal: 0.14,
  line: 0.10, binance: 0.13
};

export async function GET(req: NextRequest){
  const key = process.env.FIVESIM_API_KEY!;
  if(!key) return NextResponse.json({ price: 2500 });

  const { searchParams } = new URL(req.url);
  const service = searchParams.get("service") || "whatsapp";
  const country = searchParams.get("country") || "us";

  if(country === "ng") {
    return NextResponse.json({ price: 0, error: "Nigeria not supported" }, { status: 400 });
  }

  const fiveCountry = COUNTRY_MAP[country] || country;

  try{
    const res = await fetch("https://5sim.net/v1/guest/prices", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store"
    });
    const data = await res.json();
    // FIXED: correct order is data[service][country] not data[country][service]
    const costDollar = data?.[service]?.[fiveCountry]?.cost;
    if(costDollar){
      const costNaira = costDollar * RATE;
      const finalPrice = Math.ceil((costNaira * MARGIN) / 50) * 50;
      return NextResponse.json({ price: finalPrice });
    }
  }catch(e){}

  const fallbackCost = FALLBACK_DOLLAR[service] || 0.13;
  const finalPrice = Math.ceil((fallbackCost * RATE * MARGIN) / 50) * 50;
  return NextResponse.json({ price: finalPrice });
}
