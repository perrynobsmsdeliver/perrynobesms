import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest){
  const { email, amount, user_id } = await req.json();
  if(!email || !amount) return NextResponse.json({error:"Missing"}, {status:400});
  
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method:"POST",
    headers:{
      "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type":"application/json"
    },
    body: JSON.stringify({
      email,
      amount, // already in kobo e.g 100 *100 = 10000
      metadata: { user_id },
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://perrynobesms.vercel.app"}/api/paystack/verify`
    })
  });
  const data = await res.json();
  if(!data.status) return NextResponse.json(data, {status:400});
  return NextResponse.json(data.data);
}
