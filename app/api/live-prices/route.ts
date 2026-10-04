export const dynamic = 'force-dynamic';

// YOUR HIDDEN PROFIT - customer no fit see this, na server only
const PROFIT_MARGIN = 10;
const NAIRA_RATE = 1600;

export async function GET() {
  const key = process.env.FIVESIM_API_KEY;
  if (!key) return Response.json({ error: "No 5sim key" }, { status: 500 });

  try {
    const res = await fetch("https://5sim.net/v1/guest/prices?product=any", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store"
    });

    const data = await res.json();
    // 5sim returns: { nigeria: { whatsapp: { cost: 0.15, count: 10 } }, usa: {...} }

    const transformed: any = {};

    // Convert 5sim format -> your app format: { service: { countryFull: { price } } }
    for (const countryCode in data) {
      const services = data[countryCode];
      for (const serviceName in services) {
        const item = services[serviceName];
        const costDollar = item.cost || item.Cost || 0.2;

        // YOUR PROFIT CALCULATION - HIDDEN FROM CLIENT
        const costNaira = costDollar * NAIRA_RATE;
        const raw = costNaira * PROFIT_MARGIN;
        const finalPrice = Math.ceil(raw / 100) * 100; // round to 100

        if (!transformed[serviceName]) transformed[serviceName] = {};

        // Map 5sim country names to your COUNTRIES full names
        // 5sim uses: nigeria, usa, england, etc - same as your full field
        transformed[serviceName][countryCode] = {
          price: finalPrice, // Customer only sees this
          // cost: costDollar // DO NOT SEND COST TO CLIENT
        };
      }
    }

    return Response.json(transformed);

  } catch (e: any) {
    console.error("5sim price error", e.message);
    // Fallback with profit already applied
    return Response.json({
      whatsapp: { nigeria: { price: 2500 }, usa: { price: 3500 }, england: { price: 3200 } },
      telegram: { nigeria: { price: 2500 }, usa: { price: 3500 } },
      facebook: { nigeria: { price: 2500 }, usa: { price: 3500 } }
    });
  }
}
