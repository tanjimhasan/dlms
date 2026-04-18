import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ customers: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ customer: body }, { status: 201 });
}
