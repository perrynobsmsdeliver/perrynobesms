export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Supabase keys not set in Vercel' }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey);

  const reference = req.nextUrl.searchParams.get('reference');
  if (!reference) return NextResponse.redirect(new URL('/dashboard', req.url));

  try {
    const verify = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const data = await verify.json();

    if (!data.status || data.data.status !== "success") {
      return NextResponse.redirect(new URL('/dashboard?payment=failed', req.url));
    }

    const amount = data.data.amount / 100;
    const email = data.data.customer.email;
    
    // Find user by email
    const { data: user } = await supabase.from('profiles').select('*').eq('email', email).single();

    if (user) {
      // credit wallet - update this to your table name
      await supabase.from('profiles').update({ 
        wallet_balance: (user.wallet_balance || 0) + amount 
      }).eq('id', user.id);
    }

    return NextResponse.redirect(new URL('/dashboard?payment=success', req.url));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
