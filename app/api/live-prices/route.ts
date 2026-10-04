export const dynamic = 'force-dynamic';

export async function GET() {
  const key = process.env.FIVESIM_API_KEY;
  if(!key) return Response.json({ error: "No FIVESIM_API_KEY in Vercel env" }, { status: 500 });

  const res = await fetch("https://5sim.net/v1/guest/prices", {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store"
  });
  const data = await res.json();

  // data = { whatsapp: { nigeria: { cost, count }, usa: {...} }, telegram: {...} }
  const RATE = 1600; // $1 to Naira
  const PROFIT_X = 10; // Your ×10

  let transformed: any = {};
  for (const service in data) {
    transformed[service] = {};
    for (const country in data[service]) {
      const costDollar = data[service][country].cost;
      const costNaira = costDollar * RATE;
      const sellPrice = Math.ceil((costNaira * PROFIT_X) / 100) * 100;
      transformed[service][country] = {
        cost: costNaira,
        sell: sellPrice,
        count: data[service][country].count
      };
    }
  }

  return Response.json(transformed);
}
