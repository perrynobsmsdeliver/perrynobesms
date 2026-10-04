export const dynamic = 'force-dynamic';
export async function GET() {
  const key = process.env.FIVESIM_API_KEY;
  const res = await fetch("https://5sim.net/v1/guest/prices", {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store"
  });
  const data = await res.json();
  return Response.json(data);
}
