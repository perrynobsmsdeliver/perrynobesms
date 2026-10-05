import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  
  // FIX: Use actual request origin, not VERCEL_URL
  const origin = req.nextUrl.origin; // Will be https://perryotp.com.ng when on custom domain
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || origin;

  if (!reference) {
    return NextResponse.redirect(`${siteUrl}/?pay=failed`);
  }

  try {
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      cache: "no-store"
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      return NextResponse.redirect(`${siteUrl}/?pay=failed`);
    }

    const amount = verifyData.data.amount / 100;
    const email = verifyData.data.customer.email;

    // Prevent double credit
    const { data: exists } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("reference", reference)
      .maybeSingle();

    if (!exists) {
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const user = (userList as any).users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
      
      if (user) {
        await supabaseAdmin.from("transactions").insert({
          user_id: user.id,
          user_email: email,
          reference,
          amount,
          type: 'deposit',
          status: 'success'
        });

        const { data: wallet } = await supabaseAdmin.from("wallets").select("balance").eq("user_id", user.id).maybeSingle();
        
        if (wallet) {
          await supabaseAdmin.from("wallets").update({ balance: wallet.balance + amount }).eq("user_id", user.id);
        } else {
          await supabaseAdmin.from("wallets").insert({ user_id: user.id, balance: amount });
        }
      }
    }

    return NextResponse.redirect(`${siteUrl}/?pay=success&amount=${amount}`);

  } catch (err: any) {
    console.error("Verify error:", err);
    const origin = req.nextUrl.origin;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || origin;
    return NextResponse.redirect(`${siteUrl}/?pay=failed`);
  }
}
