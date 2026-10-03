export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest){
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const reference = req.nextUrl.searchParams.get("reference");
  
  if(!reference) {
    console.log("No reference");
    return NextResponse.redirect("https://perrynobesms.vercel.app?fund=failed", 302);
  }

  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers:{ Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const data = await res.json();
    console.log("Paystack verify:", JSON.stringify(data));

    if(data.status && data.data.status === "success"){
      const amount = data.data.amount / 100;
      const user_id = data.data.metadata?.user_id;
      const email = data.data.customer?.email;
      
      console.log("Success amount:", amount, "user_id:", user_id, "email:", email);

      let finalUserId = user_id;

      // If metadata missing, find user by email
      if(!finalUserId && email){
        const { data: userData } = await supabase.from("profiles").select("id").eq("email", email).single();
        // or check auth.users? Try wallets by email? Adjust to your table
        if(userData) finalUserId = userData.id;
        else {
          // fallback: get from auth
          const { data: authUser } = await supabase.auth.admin.listUsers();
          const found = authUser?.users?.find(u => u.email === email);
          if(found) finalUserId = found.id;
        }
      }

      if(finalUserId){
        // Use RPC or increment safely
        const { data: w } = await supabase.from("wallets").select("balance").eq("user_id", finalUserId).single();
        console.log("Current wallet:", w);
        
        const newBalance = (w?.balance || 0) + amount;
        const { error } = await supabase.from("wallets").upsert({ user_id: finalUserId, balance: newBalance }, { onConflict: 'user_id' });
        
        if(error) console.log("Wallet update error:", error);
        else console.log("Wallet updated to:", newBalance);

        // Also log transaction
        await supabase.from("transactions").insert({ user_id: finalUserId, type: 'deposit', amount, reference, status: 'success' });
      } else {
        console.log("NO USER ID FOUND - cannot credit");
      }

      return NextResponse.redirect(`https://perrynobesms.vercel.app?fund=success&amount=${amount}`, 302);
    }
  } catch(e){
    console.log("Verify error:", e);
  }
  return NextResponse.redirect("https://perrynobesms.vercel.app?fund=failed", 302);
}
