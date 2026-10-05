import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, amount } = await req.json();
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: "No PAYSTACK_SECRET_KEY" }, { status: 500 });

    if (!email || !amount) {
      return NextResponse.json({ error: "Email and amount required" }, { status: 400 });
    }

    const siteUrl = getSiteUrl(req);

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        amount: Math.round(amount * 100),
        callback_url: `${siteUrl}/api/verify-payment-redirect`,
        metadata: { email, amount }
      }),
    });

    const data = await res.json();
    if (!data.status) return NextResponse.json({ error: data.message }, { status: 400 });

    return NextResponse.json({ 
      url: data.data.authorization_url, 
      authorization_url: data.data.authorization_url,
      reference: data.data.reference 
    });
    
  } catch (e: any) {
    console.error("Initialize error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function getSiteUrl(req: NextRequest) {
  // FIX: Use real origin, not VERCEL_URL
  // If you set NEXT_PUBLIC_SITE_URL in Vercel, it uses that
  // Otherwise uses the domain user is currently on
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }
  return req.nextUrl.origin.replace(/\/$/, "");
}
