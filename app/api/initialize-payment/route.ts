import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, amount } = await req.json();
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email || "customer@perrynobe.site",
        amount: amount * 100,
        callback_url: "https://perrynobe.site",
      }),
    });
    const data = await res.json();
    if (!data.status) return NextResponse.json({ error: data.message }, { status: 400 });
    return NextResponse.json({ url: data.data.authorization_url, reference: data.data.reference });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
