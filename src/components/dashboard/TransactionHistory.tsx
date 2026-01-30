"use client";

import { useMemo, useState } from "react";
import { Transaction } from "@/store/portfolioStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, ArrowUpRight, ArrowDownRight, Gift, Trash2, Pencil } from "lucide-react";
import { TransactionDialog } from "./TransactionDialog";
import { cn } from "@/lib/utils";

interface TransactionHistoryProps {
    transactions: Transaction[];
}

type FilterType = 'all' | 'buy' | 'sell' | 'gift';

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
    const { removeTransaction } = usePortfolioStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [sortOrder] = useState<'desc' | 'asc'>('desc');

    // Filter Logic
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            // 1. Type Filter
            if (filterType === 'buy' && t.type !== 'buy') return false;
            if (filterType === 'sell' && t.type !== 'sell') return false;
            if (filterType === 'gift' && !t.type.startsWith('gift')) return false;

            // 2. Search Filter (Note or Gold Type or Date)
            if (searchTerm) {
                const lowerTerm = searchTerm.toLowerCase();
                const matchesNote = t.note?.toLowerCase().includes(lowerTerm);
                const matchesType = t.goldType.toLowerCase().includes(lowerTerm);
                const matchesDate = t.date.includes(lowerTerm);
                return matchesNote || matchesType || matchesDate;
            }

            return true;
        }).sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
    }, [transactions, filterType, searchTerm, sortOrder]);

    const handleDelete = async (id: string) => {
        if (confirm("Bạn có chắc muốn xóa giao dịch này?")) {
            await removeTransaction(id);
        }
    };

    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            {/* Header with Search & Controls */}
            <div className="flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-xl font-semibold">Lịch Sử Giao Dịch</h3>
                    <p className="text-sm text-muted-foreground">
                        Hiển thị {filteredTransactions.length}/{transactions.length} giao dịch
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm..."
                            className="bg-background pl-9 w-full sm:w-[200px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-1 rounded-lg bg-muted p-1">
                        {(['all', 'buy', 'sell', 'gift'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                    filterType === type
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                                )}
                            >
                                {type === 'all' ? 'Tất cả' : type === 'buy' ? 'Mua' : type === 'sell' ? 'Bán' : 'Quà'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Transaction List */}
            <div className="max-h-[500px] overflow-y-auto">
                {filteredTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Filter className="h-10 w-10 opacity-20 mb-3" />
                        <p>Không tìm thấy giao dịch nào</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {filteredTransactions.map((t) => (
                            <div key={t.id} className="group flex flex-col gap-4 p-4 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:p-6 transition-colors">
                                {/* Left: Icon & Info */}
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:mt-0",
                                        t.type === 'buy' ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" :
                                            t.type === 'sell' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" :
                                                "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
                                    )}>
                                        {t.type === 'buy' ? <ArrowDownRight className="h-5 w-5" /> :
                                            t.type === 'sell' ? <ArrowUpRight className="h-5 w-5" /> :
                                                <Gift className="h-5 w-5" />}
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">
                                                {t.type === 'buy' ? 'Mua vào' : t.type === 'sell' ? 'Bán ra' : t.type === 'gift_in' ? 'Được tặng' : 'Tặng quà'}
                                            </p>
                                            <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-semibold text-foreground">
                                                {t.goldType}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(t.date).toLocaleDateString('vi-VN', { weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric' })}
                                            <span className="mx-1">•</span>
                                            {t.quantity} Chỉ
                                        </p>
                                        {t.note && (
                                            <p className="text-xs italic text-muted-foreground/80">&quot;{t.note}&quot;</p>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Value & Actions */}
                                <div className="flex items-center justify-between gap-6 sm:justify-end">
                                    <div className="text-right">
                                        <p className={cn(
                                            "font-bold tabular-nums",
                                            t.type === 'buy' ? "text-foreground" : // Buy = Spend Money (Neutral/Negative context?) -> Actually usually just text-foreground or red usually means expense. user requested modern style.
                                                t.type === 'sell' ? "text-emerald-600" :
                                                    "text-purple-600"
                                        )}>
                                            {t.type === 'buy' ? '-' : t.type === 'sell' ? '+' : ''}
                                            {t.totalValue.toLocaleString('vi-VN')} ₫
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {t.price > 0 ? `${t.price.toLocaleString('vi-VN')} ₫/Chỉ` : 'Miễn phí'}
                                        </p>
                                    </div>

                                    {/* Action Buttons (Visible on Hover/Focus) */}
                                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <TransactionDialog
                                            existingTransaction={t}
                                            trigger={
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background hover:shadow-sm">
                                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            }
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => handleDelete(t.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
