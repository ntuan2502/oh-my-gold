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
    "origin": "https://sjc.com.vn",
    "referer": "https://sjc.com.vn/GoldPrice/Services/PriceService.ashx",
    "cookie": "ASP.NET_SessionId=d2e17ef4-e418-479b-824f-9f0e4b81ac17; SRV=154e77e7-a844-45fd-a837-f87154b48930"
};

interface SJCItem {
    Id: number;
    TypeName: string;
    BuyValue: number;
    SellValue: number;
    GroupDate: string;
}

interface FormattedItem {
    date: string; // ISO
    type: string;
    buy: number; // Per Chi
    sell: number; // Per Chi
}

async function fetchAndFormat(id: number, type: string, from: string, to: string): Promise<FormattedItem[]> {
    try {
        const body = new URLSearchParams({
            method: 'GetGoldPriceHistory',
            goldPriceId: id.toString(),
            fromDate: from,
            toDate: to
        });

        const res = await fetch(SJC_API_URL, {
            method: 'POST',
            headers: HEADERS,
            body: body
        });

        if (!res.ok) return [];

        const data = await res.json();
        if (!data || !data.success || !Array.isArray(data.data)) return [];

        return data.data.map((item: SJCItem) => {
            let timestamp = 0;
            const match = item.GroupDate.match(/-?\d+/);
            if (match) timestamp = parseInt(match[0]);

            if (!timestamp) return null;

            return {
                date: new Date(timestamp).toISOString(),
                type: type,
                buy: item.BuyValue / 10,
                sell: item.SellValue / 10
            };
        }).filter((item: FormattedItem | null): item is FormattedItem => item !== null);

    } catch (e) {
        console.error(`Fetch Error for ${type}:`, e);
        return [];
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');
        const goldPriceIdStr = searchParams.get('goldPriceId');

        if (!fromDate || !toDate) {
            return NextResponse.json({ error: 'Missing fromDate or toDate' }, { status: 400 });
        }

        let result: FormattedItem[] = [];

        // 1. Fetch Data
        if (goldPriceIdStr) {
            const id = parseInt(goldPriceIdStr);
            let type = 'bar'; // default fallback
            if (id === 49) type = 'ring_9999';

            result = await fetchAndFormat(id, type, fromDate, toDate);
        } else {
            const [bars, rings] = await Promise.all([
                fetchAndFormat(1, 'bar', fromDate, toDate),
                fetchAndFormat(49, 'ring_9999', fromDate, toDate)
            ]);
            result = [...bars, ...rings];
        }

        // Sort by Date
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return NextResponse.json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {
        console.error("Formatted History Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
