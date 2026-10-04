export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PROFIT_MARGIN = 10; // ×10

export async function GET(){
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { count: users } = await supabase.from("wallets").select("*", {count:"exact", head:true});
  const { data: wallets } = await supabase.from("wallets").select("balance");
  const totalWallet = wallets?.reduce((s, w) => s + (w.balance||0), 0) || 0;

  const { count: orders } = await supabase.from("orders").select("*", {count:"exact", head:true});
  const { data: allOrders } = await supabase.from("orders").select("price");
  const { data: recentOrders } = await supabase.from("orders").select("*").order("created_at", {ascending:false}).limit(20);
  const { data: recentTransactions } = await supabase.from("transactions").select("*").order("created_at", {ascending:false}).limit(20);

  // FIXED ×10 LOGIC
  const totalSales = allOrders?.reduce((s, o) => s + (o.price||0), 0) || 0;
  const totalCost = Math.round(totalSales / PROFIT_MARGIN); // 10% cost
  const totalProfit = totalSales - totalCost; // 90% profit

  return NextResponse.json({ 
    users, 
    totalWallet, 
    orders, 
    totalSales,
    totalCost,
    totalProfit,
    profitMargin: PROFIT_MARGIN,
    recentOrders, 
    recentTransactions 
  });
}
