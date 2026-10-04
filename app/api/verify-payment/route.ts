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

    // Find user - FIXED VERSION
    let userId = metadata_user_id;

    if (!userId && email) {
      // Find from auth.users by email
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const found = authUsers.users.find((u: any) => u.email === email);
      if (found) userId = found.id;
    }

    if (userId) {
      // Check if transaction already processed (prevent double credit)
      const { data: existing } = await supabase.from('transactions').select('id').eq('reference', reference).maybeSingle();
      
      if (!existing) {
        // Get current balance
        const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', userId).maybeSingle();
        const currentBal = wallet?.balance || 0;
        const newBal = currentBal + amount;

        // FIXED: No updated_at, no profiles table
        if (wallet) {
          await supabase.from('wallets').update({ balance: newBal }).eq('user_id', userId);
        } else {
          await supabase.from('wallets').insert({ user_id: userId, balance: newBal });
        }

        // Save transaction
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
    return NextResponse.redirect(new URL('/dashboard?fund=failed', req.url));
  }
}
