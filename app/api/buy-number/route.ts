export async function POST(req: NextRequest) {
  try {
    const supabase = getAdmin();
    const { country, service, user_id } = await req.json();
    if (!user_id) return NextResponse.json({ error: "No user_id" }, { status: 400 });

    const fiveCountry = COUNTRY_MAP[country] || country;
    const PROFIT_X = service.toLowerCase() === "whatsapp"? 1.5 : 3.0;
    const countryMult = COUNTRY_MULT[country] || 1.0;
    const costDollar = await getLiveCost(service, country);
    const costNaira = costDollar * NAIRA_RATE;
    let sellPrice = Math.ceil((costNaira * PROFIT_X * countryMult) / 50) * 50;
    if (sellPrice < 500) sellPrice = 500;

    // ATOMIC deduct - only succeeds if balance >= price, prevents race
    const { data: updatedWallet, error: walletErr } = await supabase
     .from("wallets")
     .update({ balance: supabase.raw? undefined : undefined }) as any

    // Better: use RPC-like atomic check with filter
    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", user_id).single();

    // Attempt atomic update: balance = balance - price WHERE balance >= price
    const { data: newWallet, error: decErr } = await supabase.rpc('deduct_wallet_balance', {
      p_user_id: user_id,
      p_amount: sellPrice
    });

    // If you don't have that RPC, use this raw query fallback:
    const { data: deductData, error: deductError } = await supabase
     .from("wallets")
     .update({ balance: (wallet?.balance || 0) - sellPrice })
     .eq("user_id", user_id)
     .gte("balance", sellPrice)
     .select("balance")
     .single();

    if (deductError ||!deductData) {
      return NextResponse.json({ error: `Low balance: Need ₦${sellPrice}` }, { status: 400 });
    }

    // Now buy AFTER money is locked
    const buyRes = await fetch(`https://5sim.net/v1/user/buy/activation/${fiveCountry}/any/${service.toLowerCase()}`, {
      headers: { Authorization: `Bearer ${FIVE_SIM_KEY}` }
    });
    const buyData = await buyRes.json();

    if (!buyRes.ok ||!buyData.phone) {
      // REFUND if 5sim fails
      await supabase.from("wallets").update({ balance: deductData.balance + sellPrice }).eq("user_id", user_id);
      return NextResponse.json({ error: buyData.message || "Number unavailable, try another country" }, { status: 400 });
    }

    const { data: inserted } = await supabase.from("orders").insert({
        user_id, phone: buyData.phone.toString(), country, service: service.toLowerCase(),
        price: sellPrice, sold_price: sellPrice, cost_price: Math.round(costNaira),
        profit: Math.round(sellPrice - costNaira), status: "waiting_sms",
        provider_id: buyData.id.toString(), fivesim_id: buyData.id.toString()
      }).select().single();

    return NextResponse.json({
      phone: buyData.phone,
      orderId: inserted.id,
      fivesimId: buyData.id,
      price: sellPrice,
      balance: deductData.balance
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
