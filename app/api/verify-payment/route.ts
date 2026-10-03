export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest){
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const reference = req.nextUrl.searchParams.get("reference");
  if(!reference) return NextResponse.redirect(new URL("/dashboard?fund=failed", req.url));

  try {
    const verify = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const data = await verify.json();

    if(!data.status || data.data.status !== "success"){
      return NextResponse.redirect(new URL("/dashboard?fund=failed", req.url));
    }

    const amount = data.data.amount / 100;
    const email = data.data.customer.email;

    // Find user by email
    const { data: user } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    // if you don't have users table, use auth
    let userId = user?.id;
    if(!userId){
      const { data: authUser } = await supabase.auth.admin.listUsers();
      const found = authUser.users.find((u:any) => u.email === email);
      userId = found?.id;
    }

    if(userId){
      const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", userId).single();
      if(wallet){
        await supabase.from("wallets").update({ balance: wallet.balance + amount }).eq("user_id", userId);
      } else {
        await supabase.from("wallets").insert({ user_id: userId, balance: amount });
      }
    }

    return NextResponse.redirect(new URL(`/dashboard?fund=success&amount=${amount}`, req.url));
    
  } catch (e:any){
    console.error(e);
    return NextResponse.redirect(new URL("/dashboard?fund=failed", req.url));
  }
}
