import { NextResponse } from "next/server";
import { getExchangeRate } from "@/lib/api/currencyService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = searchParams.get("base") ?? "USD";
  const quote = searchParams.get("quote") ?? "EUR";
  const rate = await getExchangeRate(base, quote);
  return NextResponse.json(rate);
}
