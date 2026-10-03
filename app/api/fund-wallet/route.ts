export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest){
  try {
    const { email, amount } = await req.json();
    
    if(!email || !amount) return NextResponse.json({error:"Missing email/amount"}, {status:400});

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Paystack uses kobo
        callback_url: `https://perrynobesms.vercel.app/api/verify-payment`,
      })
    });

    const data = await paystackRes.json();
    if(!paystackRes.ok || !data.status){
      return NextResponse.json({error: data.message || "Paystack init failed"}, {status:500});
    }

    return NextResponse.json({ url: data.data.authorization_url, reference: data.data.reference });

  } catch (e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}
