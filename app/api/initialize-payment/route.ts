import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, amount, user_id } = await req.json();
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: "No PAYSTACK_SECRET_KEY" }, { status: 500 });
    if (!email || !amount || !user_id) return NextResponse.json({ error: "Email, amount and user_id required" }, { status: 400 });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || req.nextUrl.origin.replace(/\/$/, "");

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100),
        callback_url: `${siteUrl}/api/verify-payment-redirect`,
        metadata: { user_id, email }
      }),
    });
    const data = await res.json();
    if (!data.status) return NextResponse.json({ error: data.message }, { status: 400 });
    return NextResponse.json({ url: data.data.authorization_url, authorization_url: data.data.authorization_url, reference: data.data.reference });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
