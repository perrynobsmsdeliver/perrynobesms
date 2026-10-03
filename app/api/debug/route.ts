export async function GET(){
  return Response.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET ✅ " + process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0,20) : "MISSING ❌",
    anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET ✅ len=" + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length : "MISSING ❌",
    service: process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET ✅" : "MISSING ❌",
    paystack: process.env.PAYSTACK_SECRET_KEY ? "SET ✅" : "MISSING ❌",
  })
}
