// @ts-nocheck
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey);

  const reference = req.nextUrl.searchParams.get('reference');
  if (!reference) return NextResponse.redirect(new URL('/dashboard?fund=failed', req.url));

  try {
    const verify = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      cache: 'no-store'
    });
    const data = await verify.json();

    if (!data.status || data.data.status !== "success") {
      return NextResponse.redirect(new URL('/dashboard?fund=failed', req.url));
    }

    const amount = data.data.amount / 100;
    const email = data.data.customer.email;
    const metadata_user_id = data.data.metadata?.user_id;

    // Find user by metadata first, then by email
    let userId = metadata_user_id;
    let userProfile: any = null;

    if (!userId && email) {
      const { data: profile } = await supabase.from('profiles').select('id, wallet_balance').eq('email', email).maybeSingle();
      if (profile) {
        userId = profile.id;
        userProfile = profile;
      }
    } else if (userId) {
      const { data: profile } = await supabase.from('profiles').select('id, wallet_balance').eq('id', userId).maybeSingle();
      userProfile = profile;
    }

    if (userId) {
      // 1. Update wallets table (your main wallet table)
      const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', userId).maybeSingle();
      const currentBal = wallet?.balance || userProfile?.wallet_balance || 0;
      const newBal = currentBal + amount;

      await supabase.from('wallets').upsert(
        { user_id: userId, balance: newBal, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

      // 2. Also update profiles.wallet_balance for safety
      await supabase.from('profiles').update({ wallet_balance: newBal }).eq('id', userId);

      // 3. Save transaction if not exists
      const { data: existing } = await supabase.from('transactions').select('id').eq('reference', reference).maybeSingle();
      if (!existing) {
        await supabase.from('transactions').insert({
          user_id: userId,
          amount: amount,
          type: 'deposit',
          status: 'success',
          reference: reference,
          description: `Wallet funding via Paystack - ${reference}`
        });
      }
    }

    return NextResponse.redirect(new URL(`/dashboard?fund=success&amount=${amount}`, req.url));
  } catch (e: any) {
    console.log("verify error", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
