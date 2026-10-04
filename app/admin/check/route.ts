import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();
  
  // YOUR ADMIN PASSWORD - you can change this
  const ADMIN_PASSWORD = "PerryNobe123";

  if (password === ADMIN_PASSWORD) {
    return NextResponse.json({ ok: true });
  } else {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
}
