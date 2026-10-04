import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();
  
  const ADMIN_PASSWORD = "Perry2026";

  if (password === ADMIN_PASSWORD) {
    return NextResponse.json({ ok: true });
  } else {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
}
