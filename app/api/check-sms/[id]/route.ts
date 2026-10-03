export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const res = await fetch(`https://5sim.net/v1/user/check/${id}`, {
    headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}`, Accept: "application/json" }
  });
  const data = await res.json();
  return NextResponse.json(data);
}
