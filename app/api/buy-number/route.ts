import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

const FIVE_SIM_KEY = process.env.FIVE_SIM_API_KEY;

export async function POST(req: NextRequest){
  const supabase = getAdmin();
  try {
    const { country, service, user_id, price } = await req.json();
    if(!user_id) return NextResponse.json({error:"Not logged in"}, {status:401});
    if(!FIVE_SIM_KEY) return NextResponse.json({error:"Add FIVE_SIM_API_KEY in Vercel"}, {status:500});

    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();
    if(!wallet || wallet.balance < price) return NextResponse.json({error:`Low balance: Have ₦${wallet?.balance} Need ₦${price}`}, {status:400});

    const countryMap: any = {
      us:"usa", gb:"england", ng:"nigeria", gh:"ghana", za:"southafrica", ke:"kenya", ca:"canada", in:"india",
      au:"australia", de:"germany", fr:"france", id:"indonesia", ph:"philippines", my:"malaysia", sg:"singapore",
      ae:"uae", tr:"turkey", ru:"russia", ua:"ukraine", pl:"poland", es:"spain", br:"brazil", mx:"mexico",
      jp:"japan", sa:"saudiarabia", eg:"egypt", pk:"pakistan", bd:"bangladesh", th:"thailand", vn:"vietnam",
      it:"italy", nl:"netherlands", se:"sweden", ch:"switzerland"
    };
    const realCountry = countryMap[country] || "usa";

    const buyRes = await fetch(`https://5sim.net/v1/user/buy/activation/${realCountry}/any/${service}`, {
      headers: { Authorization: `Bearer ${FIVE_SIM_KEY}`, Accept: "application/json" }
    });
    const buyData = await buyRes.json();
    if(!buyRes.ok) return NextResponse.json({error:`5sim failed: ${JSON.stringify(buyData)}`}, {status:400});

    await supabase.from("wallets").update({ balance: wallet.balance - price }).eq("user_id", user_id);
    await supabase.from("orders").insert({
      user_id, phone: buyData.phone, country, service, price, status:"active", provider_id: buyData.id.toString()
    });

    return NextResponse.json({ success:true, phone: buyData.phone, orderId: buyData.id });

  } catch(e:any){ return NextResponse.json({error:e.message}, {status:500}); }
}

export async function GET(req: NextRequest){
  const checkId = req.nextUrl.searchParams.get("checkId");
  if(checkId && FIVE_SIM_KEY){
     const res = await fetch(`https://5sim.net/v1/user/check/${checkId}`, {
       headers: { Authorization: `Bearer ${FIVE_SIM_KEY}`, Accept:"application/json" }
     });
     return NextResponse.json(await res.json());
  }
  const user_id = req.nextUrl.searchParams.get("user_id");
  const supabase = getAdmin();
  if(!user_id) return NextResponse.json([]);
  const { data } = await supabase.from("orders").select("*").eq("user_id", user_id).order("created_at",{ascending:false});
  return NextResponse.json(data || []);
}
