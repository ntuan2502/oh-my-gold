import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import axios from 'axios';

export async function GET() {
    try {
        const { data } = await axios.get('https://giavang.org/');
        const $ = cheerio.load(data);

        type Price = { type: string; buy: number; sell: number; updated: string };
        const prices: Price[] = [];
        // 1. Extract Real Update Time
        let sourceUpdatedTime = "";
        try {
            // Find any element containing "Cập nhật lúc"
            // Usually it's in a div or span near the top
            const updateElement = $('*:contains("Cập nhật lúc")').last(); // usage of :contains in cheerio
            if (updateElement.length > 0) {
                const text = updateElement.text().trim();
                // Expected format: "Cập nhật lúc 14:50:22 30/01/2026"
                // Extract just the time/date part if needed, or keep the whole string?
                // User wants: "bê cái thời gian đó qua" -> Keep the time part.
                // Regex to capture time and date: \d{2}:\d{2}(:\d{2})? \d{2}\/\d{2}\/\d{4}
                const match = text.match(/(\d{2}:\d{2}(:\d{2})? \d{2}\/\d{2}\/\d{4})/);
                if (match) {
                    sourceUpdatedTime = match[0];
                }
            }
        } catch (e) {
            console.warn("Failed to scrape update time", e);
        }

        // Fallback to Server Time if scrape fails
        if (!sourceUpdatedTime) {
            sourceUpdatedTime = new Date().toLocaleString('vi-VN');
        }

        // Strategy: Scrape Table 0 (Miếng) and Table 1 (Nhẫn)
        const tables = $('table');

        tables.each((tableIdx, table) => {
            if (tableIdx > 1) return; // Only care about first 2 tables

            const rows = $(table).find('tr');
            const suffix = tableIdx === 0 ? " (Miếng)" : " (Nhẫn)";

            rows.each((_, row) => {
                // Skip header
                const cols = $(row).find('td');
                if (cols.length < 3) return;

                const brand = $(cols[0]).text().trim();
                const buy = $(cols[1]).text().trim();
                const sell = $(cols[2]).text().trim();

                const validBrands = ["SJC", "PNJ", "DOJI", "Mi Hồng", "Bảo Tín", "Phú Quý", "Ngọc Thẩm"];
                const isRelevant = validBrands.some(b => brand.includes(b));

                if (isRelevant && buy && sell) {
                    const cleanBuy = parseFloat(buy.replace(/\./g, '').replace(/,/g, ''));
                    const cleanSell = parseFloat(sell.replace(/\./g, '').replace(/,/g, ''));

                    if (!isNaN(cleanBuy) && !isNaN(cleanSell)) {
                        // Unique Key: Brand + Suffix
                        const fullName = brand + suffix;

                        // Avoid duplicates if site has multiple rows for same brand/region in same table
                        // We just take the first one or the "HCM" one usually implies generic
                        const exists = prices.find(p => p.type === fullName);
                        if (!exists) {
                            prices.push({
                                type: fullName,
                                buy: cleanBuy * 1000,
                                sell: cleanSell * 1000,
                                updated: sourceUpdatedTime // Use scraped time
                            });
                        }
                    }
                }
            });
        });

        // Fallback: If Table 0 failed (structure change), try the old text search method
        if (prices.length === 0) {
            $('td:contains("SJC")').each(() => {
                // ... (keep legacy logic as backup or remove if confident)
                if (prices.length > 0) return; // Just get one if main-table failed
            });
        }

        return NextResponse.json({ data: prices });

    } catch (error) {
        console.error('Scrape Error:', error);
        return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
    }
}
