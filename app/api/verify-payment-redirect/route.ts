import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const amountStr = searchParams.get("amount");

  if (!reference) {
    return NextResponse.redirect(`${getSiteUrl()}?pay=failed`);
  }

  try {
    // Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      return NextResponse.redirect(`${getSiteUrl()}?pay=failed`);
    }

    const amount = verifyData.data.amount / 100; // Paystack sends kobo
    const email = verifyData.data.customer.email;

    // Check if transaction already exists to prevent double credit
    const { data: exists } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("reference", reference)
      .maybeSingle();

    if (!exists) {
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const user = (userList as any).users.find((u: any) => u.email === email);
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

    return NextResponse.redirect(`${getSiteUrl()}?pay=success&amount=${amount}`);

  } catch (err: any) {
    console.error("Verify error:", err);
    return NextResponse.redirect(`${getSiteUrl()}?pay=failed`);
  }
}

function getSiteUrl() {
  // This fixes your perrynobe.site bug - it will use whatever domain you set in Vercel ENV
  const url = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "https://perrynobesms-rouge.vercel.app";
  // Ensure https://
  if (url.startsWith("http")) return url.replace(/\/$/, "");
  return `https://${url}`.replace(/\/$/, "");
}
