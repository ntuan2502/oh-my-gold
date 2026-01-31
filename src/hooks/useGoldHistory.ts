import { useState, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { writeBatch, doc } from 'firebase/firestore';
import { format } from 'date-fns';

interface HistoryItem {
    date: string;
    type: string;
    buy: number;
    sell: number;
}

export function useGoldHistory() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<HistoryItem[]>([]);

    const fetchAndSyncHistory = useCallback(async (fromDate: string, toDate: string) => {
        setLoading(true);
        try {
            // 1. Call Formatted API
            const res = await fetch(`/api/sjc/formatted?fromDate=${fromDate}&toDate=${toDate}`);
            if (!res.ok) throw new Error("Failed to fetch history");

            const json = await res.json();
            if (!json.success || !Array.isArray(json.data)) return;

            const items: HistoryItem[] = json.data;
            setData(items);

            // 2. Sync to Firestore (Client-side)
            if (items.length > 0) {
                const batch = writeBatch(db);
                let count = 0;

                items.forEach(item => {
                    const dateObj = new Date(item.date);
                    // ID: bar_20260130_090000
                    const dateKey = format(dateObj, 'yyyyMMdd_HHmmss');
                    const docId = `${item.type}_${dateKey}`;
                    const docRef = doc(db, "gold_price_history", docId);

                    batch.set(docRef, {
                        ...item,
                        provider: 'SJC',
                        syncedAt: new Date().toISOString()
                    });
                    count++;
                });

                await batch.commit();
                console.log(`[Sync] Saved ${count} records to Firestore.`);
            }

        } catch (error) {
            console.error("History Sync Error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        fetchAndSyncHistory,
        historyData: data,
        loading
    };
}
