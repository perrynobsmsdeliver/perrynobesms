import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin(){
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth:{persistSession:false} });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getAdmin();
    let { email, amount, user_id } = body;

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: "No PAYSTACK_SECRET_KEY" }, { status: 500 });

    // AUTO-FIX: Get missing data from Supabase Auth
    if ((!email || !user_id) && req.headers.get('authorization')) {
      const token = req.headers.get('authorization')!.replace('Bearer ', '');
      const { data } = await supabase.auth.getUser(token);
      if (data?.user) {
        user_id = user_id || data.user.id;
        email = email || data.user.email;
      }
    }

    // Fallback: get email from profiles table
    if (!email && user_id) {
      const { data } = await supabase.from('profiles').select('email').eq('id', user_id).single();
      if (data?.email) email = data.email;
    }

    if (!email || !amount || !user_id) {
      return NextResponse.json({ 
        error: `Email, amount and user_id required - Debug: email=${email || 'missing'} user_id=${user_id || 'missing'} amount=${amount || 'missing'}` 
      }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || req.nextUrl.origin.replace(/\/$/, "");

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        amount: Math.round(Number(amount) * 100),
        callback_url: `${siteUrl}/api/verify-payment-redirect`,
        metadata: { user_id, email }
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
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
