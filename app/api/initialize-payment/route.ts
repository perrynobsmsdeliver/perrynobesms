import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, amount } = await req.json();
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: "No PAYSTACK_SECRET_KEY" }, { status: 500 });

    if (!email || !amount) {
      return NextResponse.json({ error: "Email and amount required" }, { status: 400 });
    }

    // Get site URL dynamically from ENV - never hardcode perrynobe.site
    const siteUrl = getSiteUrl();

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
      }),
    });

    const data = await res.json();
    if (!data.status) return NextResponse.json({ error: data.message }, { status: 400 });

    return NextResponse.json({ url: data.data.authorization_url, reference: data.data.reference });
    
  } catch (e: any) {
    console.error("Initialize error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "https://perrynobesms-rouge.vercel.app";
  if (url.startsWith("http")) return url.replace(/\/$/, "");
  return `https://${url}`.replace(/\/$/, "");
}
