import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest){
  const { email, amount, user_id } = await req.json();
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method:"POST",
    headers:{ Authorization:`Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type":"application/json" },
    body: JSON.stringify({ 
      email, 
      amount, 
      metadata:{ user_id },
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/paystack/verify`
    })
  });
  const data = await res.json();
  if(!res.ok) return NextResponse.json({ error: data.message }, { status:400 });
  return NextResponse.json(data.data);
}
