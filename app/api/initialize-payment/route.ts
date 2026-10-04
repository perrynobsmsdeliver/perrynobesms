import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, amount } = await req.json();
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: "No PAYSTACK_SECRET_KEY" }, { status: 500 });

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email || "customer@perrynobe.site",
        amount: Math.round(amount * 100),
        callback_url: "https://perrynobesms-rouge.vercel.app/api/verify-payment-redirect",
      }),
    });
    const data = await res.json();
    if (!data.status) return NextResponse.json({ error: data.message }, { status: 400 });
    return NextResponse.json({ url: data.data.authorization_url, reference: data.data.reference });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
