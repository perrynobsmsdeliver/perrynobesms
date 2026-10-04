export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY!;
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
  if (hash!== signature) return NextResponse.json({ error: "Invalid" }, { status: 401 });

  const event = JSON.parse(body);
  if (event.event === "charge.success") {
    const data = event.data;
    const reference: string = data.reference;
    const amount = data.amount / 100;
    const email = data.customer?.email?.toLowerCase();

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: existing } = await supabase.from("transactions").select("id").eq("reference", reference).maybeSingle();
    if (existing) return NextResponse.json({ ok: true });

    let userId: string | null = null;
    const parts = reference.split("_");
    if (parts.length >= 3) userId = parts[2];
    if (!userId && data.metadata?.user_id) userId = data.metadata.user_id;

    if (!userId && email) {
      const { data: userData } = await supabase.auth.admin.listUsers();
      const found = (userData.users as any[]).find((u: any) => u.email?.toLowerCase() === email);
      if (found) userId = found.id;
    }

    if (!userId) {
      if (email) await supabase.from("transactions").insert({ user_email: email, type: "deposit", amount, reference });
      return NextResponse.json({ ok: true });
    }

    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", userId).maybeSingle();
    if (wallet) {
      await supabase.from("wallets").update({ balance: (wallet.balance as number) + amount }).eq("user_id", userId);
    } else {
      await supabase.from("wallets").insert({ user_id: userId, balance: amount });
    }

    const { data: userInfo } = await supabase.auth.admin.getUserById(userId);
    const userEmail = (userInfo.user as any)?.email || email;
    if (userEmail) {
      await supabase.from("transactions").insert({ user_email: userEmail, type: "deposit", amount, reference });
    }
  }
  return NextResponse.json({ ok: true });
}
