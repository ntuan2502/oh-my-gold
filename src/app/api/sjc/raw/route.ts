import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SJC_API_URL = "https://sjc.com.vn/GoldPrice/Services/PriceService.ashx";

const HEADERS = {
    "sec-ch-ua": '"Not(A:Brand";v="8", "Chromium";v="144", "Microsoft Edge";v="144"',
    "accept": "*/*",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "x-requested-with": "XMLHttpRequest",
    "sec-ch-ua-mobile": "?0",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0",
    "sec-ch-ua-platform": '"Windows"',
    "origin": "https://sjc.com.vn",
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
    "referer": "https://sjc.com.vn/GoldPrice/Services/PriceService.ashx",
    "accept-language": "vi,en-US;q=0.9,en;q=0.8",
    "cookie": "ASP.NET_SessionId=d2e17ef4-e418-479b-824f-9f0e4b81ac17; SRV=154e77e7-a844-45fd-a837-f87154b48930"
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');
        const goldPriceId = searchParams.get('goldPriceId') || '1'; // Default to Bar (1)

        if (!fromDate || !toDate) {
            return NextResponse.json({ error: 'Missing fromDate or toDate parameters' }, { status: 400 });
        }

        const body = new URLSearchParams({
            method: 'GetGoldPriceHistory',
            goldPriceId: goldPriceId,
            fromDate: fromDate,
            toDate: toDate
        });

        console.log(`Proxying SJC request: ID=${goldPriceId}, ${fromDate} -> ${toDate}`);

        const res = await fetch(SJC_API_URL, {
            method: 'POST',
            headers: HEADERS,
            body: body
        });

        if (!res.ok) {
            return NextResponse.json({ error: `SJC API Error: ${res.status} ${res.statusText}` }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Proxy Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
