export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest){
  try{
    const { email, amount, user_id } = await req.json();
    if(!email ||!amount ||!user_id) return NextResponse.json({error:"Missing email, amount or user_id"}, {status:400});

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://perrynobesms.vercel.app";

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method:"POST",
      headers:{ 
        "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 
        "Content-Type":"application/json" 
      },
      body: JSON.stringify({
        email,
        amount: Number(amount) * 100,
        metadata: { user_id, custom_fields: [{ display_name: "User ID", variable_name: "user_id", value: user_id }] },
        callback_url: `${siteUrl}/api/paystack/verify?userId=${user_id}`
      })
    });
    const data = await res.json();
    if(!data.status) return NextResponse.json({error: data.message || JSON.stringify(data)}, {status:400});
    return NextResponse.json(data.data);
  }catch(e:any){
    return NextResponse.json({error:e.message},{status:500});
  }
}
