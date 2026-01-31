"use client";

import { useMemo, useState } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface HistoryItem {
    date: string;
    type: string;
    buy: number;
    sell: number;
}

interface GoldPriceChartProps {
    data: HistoryItem[];
    loading?: boolean;
}

export function GoldPriceChart({ data, loading }: GoldPriceChartProps) {
    // Visibility State for Legend Toggling
    const [visibility, setVisibility] = useState<Record<string, boolean>>({
        barBuy: true,
        barSell: true,
        ringBuy: true,
        ringSell: true
    });

    const SERIES = [
        { key: 'barBuy', name: 'SJC Miếng (Mua)', color: '#EAB308' },
        { key: 'barSell', name: 'SJC Miếng (Bán)', color: '#CA8A04' },
        { key: 'ringBuy', name: 'Nhẫn 9999 (Mua)', color: '#F97316' },
        { key: 'ringSell', name: 'Nhẫn 9999 (Bán)', color: '#C2410C' },
    ];

    // Toggle Visibility
    const toggleSeries = (key: string) => {
        setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    // Transform Data
    const chartData = useMemo(() => {
        if (!data.length) return [];

        const grouped = new Map<string, {
            rawDate: string;
            displayDate: string;
            timestamp: number;
            barBuy?: number;
            barSell?: number;
            ringBuy?: number;
            ringSell?: number;
        }>();

        data.forEach((item) => {
            const key = item.date;

            let entry = grouped.get(key);
            if (!entry) {
                entry = {
                    rawDate: key,
                    displayDate: format(parseISO(key), "dd/MM HH:mm"),
                    timestamp: new Date(key).getTime(),
                };
                grouped.set(key, entry);
            }

            if (item.type === "bar") {
                entry.barBuy = item.buy;
                entry.barSell = item.sell;
            } else if (item.type === "ring_9999") {
                entry.ringBuy = item.buy;
                entry.ringSell = item.sell;
            }
        });

        return Array.from(grouped.values()).sort((a, b) => a.timestamp - b.timestamp);
    }, [data]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
        );
    }

    if (chartData.length === 0) return null;

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">Biểu Đồ Giá Vàng (30 Ngày)</CardTitle>
                    </div>
                    {/* Custom Legend (External) */}
                    <div className="flex flex-wrap gap-2">
                        {SERIES.map((s) => (
                            <button
                                key={s.key}
                                onClick={() => toggleSeries(s.key)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                                    visibility[s.key]
                                        ? "bg-secondary text-secondary-foreground border-transparent shadow-sm"
                                        : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                                )}
                                style={{
                                    // Add subtle color hint even when inactive, or bold ring when active
                                    boxShadow: visibility[s.key] ? `0 0 0 1px ${s.color}20` : 'none'
                                }}
                            >
                                <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{
                                        backgroundColor: s.color,
                                        opacity: visibility[s.key] ? 1 : 0.3
                                    }}
                                />
                                {s.name}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorRing" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
                            <XAxis
                                dataKey="displayDate"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fill: '#888' }}
                                minTickGap={30}
                            />
                            <YAxis
                                domain={['auto', 'auto']}
                                tickFormatter={(val) => (val / 1000000).toFixed(1) + 'M'}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fill: '#888' }}
                                width={40}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value: number | string | undefined) => (value !== undefined && value !== null) ? Number(value).toLocaleString('vi-VN') + ' ₫' : 'N/A'}
                                labelStyle={{ color: '#666', marginBottom: '4px' }}
                            />

                            {/* SJC Bar Lines */}
                            <Area
                                type="monotone"
                                name="SJC Miếng (Mua)"
                                dataKey="barBuy"
                                stroke="#EAB308"
                                fillOpacity={1}
                                fill="url(#colorBar)"
                                strokeWidth={2}
                                activeDot={{ r: 6 }}
                                connectNulls
                                hide={!visibility.barBuy}
                            />
                            <Area
                                type="monotone"
                                name="SJC Miếng (Bán)"
                                dataKey="barSell"
                                stroke="#CA8A04"
                                strokeDasharray="3 3"
                                fill="none"
                                strokeWidth={1}
                                connectNulls
                                hide={!visibility.barSell}
                            />

                            {/* Ring Lines */}
                            <Area
                                type="monotone"
                                name="Nhẫn 9999 (Mua)"
                                dataKey="ringBuy"
                                stroke="#F97316"
                                fillOpacity={1}
                                fill="url(#colorRing)"
                                strokeWidth={2}
                                activeDot={{ r: 6 }}
                                connectNulls
                                hide={!visibility.ringBuy}
                            />
                            <Area
                                type="monotone"
                                name="Nhẫn 9999 (Bán)"
                                dataKey="ringSell"
                                stroke="#C2410C"
                                strokeDasharray="3 3"
                                fill="none"
                                strokeWidth={1}
                                connectNulls
                                hide={!visibility.ringSell}
                            />

                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
