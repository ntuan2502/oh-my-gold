"use client";

import { useEffect, useState } from "react";

// Types for Gold Price Data
export interface GoldPrice {
    type: string;
    buy: number;
    sell: number;
    updated: string;
}

// Mock API responses for fallback
const MOCK_API_RESPONSE = [
    { type: "SJC", buy: 82500000, sell: 84500000 },
    { type: "Nhẫn Trơn 9999", buy: 75500000, sell: 77000000 },
    { type: "Vàng Thế Giới (USD/oz)", buy: 2350 * 25000, sell: 2351 * 25000 },
];

export const useGoldPrice = () => {
    const [prices, setPrices] = useState<GoldPrice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPrices = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/gold-price');
            if (!res.ok) throw new Error('API Failed');
            const { data } = await res.json();

            if (data && data.length > 0) {
                setPrices(data);
                setError(null);
            } else {
                throw new Error("No data returned");
            }
        } catch (err) {
            console.warn("API Fetch Failed, using Mock Data", err);
            setError("Failed to fetch real prices, using Last Known");
            // Fallback
            const staticData = MOCK_API_RESPONSE.map(p => ({
                ...p,
                updated: new Date().toLocaleTimeString('vi-VN')
            }));
            setPrices(staticData);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrices();
        const interval = setInterval(fetchPrices, 60000); // 1 minute refresh for server efficiency
        return () => clearInterval(interval);
    }, []);

    return { prices, loading, error, refresh: fetchPrices };
};
