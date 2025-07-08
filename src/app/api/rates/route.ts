import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.CURRENCY_API_KEY;
  const symbols = "USD,EUR,GBP,PKR,JPY,CAD,AUD,CNY,CHF,NZD,SEK,NOK,DKK,SGD";
  const url = `https://api.currencyfreaks.com/v2.0/rates/latest?apikey=${apiKey}&symbols=${symbols}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch rates" },
        { status: 500 }
      );
    }
    const data = await res.json();
    return NextResponse.json({ rates: data.rates });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch rates" },
      { status: 500 }
    );
  }
}
