import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { xml?: string; title?: string };
  if (!body.xml) {
    return NextResponse.json({ error: "Missing xml payload." }, { status: 400 });
  }
  return NextResponse.json({ ok: true, title: body.title ?? "exercise", xml: body.xml });
}
