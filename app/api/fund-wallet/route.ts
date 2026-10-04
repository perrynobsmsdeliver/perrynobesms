export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest){
  try {
    const { email, amount } = await req.json();
    
    if(!email || !amount) return NextResponse.json({error:"Missing email/amount"}, {status:400});

    const authHeader = req.headers.get("authorization");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader || "" } }
    });
    const { data: { user } } = await supabase.auth.getUser();

    const reference = user 
      ? `fund_${Date.now()}_${user.id}_${Math.random().toString(36).slice(2,6)}`
      : `fund_${Date.now()}_${email}_${Math.random().toString(36).slice(2,6)}`;

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100),
        reference: reference,
        metadata: {
          user_id: user?.id,
          custom_fields: [{ display_name: "User ID", variable_name: "user_id", value: user?.id }]
        },
        // FIXED - new domain + real page, not /api
        callback_url: `https://perrynobesms-rouge.vercel.app/dashboard?pay=success&ref=${reference}`,
      })
    });

    const data = await paystackRes.json();
    if(!paystackRes.ok || !data.status){
      console.log("Paystack error:", data);
      return NextResponse.json({error: data.message || "Paystack init failed"}, {status:500});
    }

    return NextResponse.json({ url: data.data.authorization_url, reference: data.data.reference });

  } catch (e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}
