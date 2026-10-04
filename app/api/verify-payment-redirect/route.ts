import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference") || req.nextUrl.searchParams.get("trxref");
  if (!reference) return NextResponse.redirect("https://perrynobe.site?pay=failed");

  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}` },
  });
  const verifyData = await verifyRes.json();
  
  if (!verifyData.status || verifyData.data?.status !== 'success') {
    return NextResponse.redirect("https://perrynobe.site?pay=failed");
  }

  const amount = verifyData.data.amount / 100;
  const email = verifyData.data.customer.email;

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ) as any;

  const { data: exists } = await supabaseAdmin.from("transactions").select("id").eq("reference", reference).maybeSingle();
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

  return NextResponse.redirect(`https://perrynobe.site?pay=success&amount=${amount}`);
}
