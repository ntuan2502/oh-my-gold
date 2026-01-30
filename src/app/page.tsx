"use client";

import { PriceTicker } from "@/components/dashboard/PriceTicker";
import { TransactionDialog } from "@/components/dashboard/TransactionDialog";
import { Button } from "@/components/ui/button";
import { MarketPriceBoard } from "@/components/dashboard/MarketPriceBoard";
import { TransactionHistory } from "@/components/dashboard/TransactionHistory";
import { ArrowRight, Coins, TrendingUp, PiggyBank, Plus } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePortfolioStore } from "@/store/portfolioStore";
import { useGoldPrice } from "@/hooks/useGoldPrice";

export default function Home() {
  const { user, login } = useAuth();
  const { getHoldings, transactions, fetchTransactions } = usePortfolioStore();
  const { prices } = useGoldPrice();

  // Load Transactions on User Change
  useEffect(() => {
    if (user?.uid) {
      fetchTransactions(user.uid);
    }
  }, [user, fetchTransactions]);

  // Calculate Dynamic Data
  const { totalQuantity, totalInvested, breakdown } = getHoldings(); // Quantity is in Chi

  // Valuation Logic: 
  // 1. Group Holdings by Type
  const holdingsByType: Record<string, number> = {};
  transactions.forEach(t => {
    let qty = 0;
    if (t.type === 'buy' || t.type === 'gift_in') qty = t.quantity;
    else qty = -t.quantity;

    holdingsByType[t.goldType] = (holdingsByType[t.goldType] || 0) + qty;
  });

  // 2. Calculate Total Asset Value
  let totalAssetValue = 0;

  // Helper to find price
  const findBuyPricePerChi = (typeKey: string) => {
    let searchTerms: string[] = [];
    if (typeKey === 'sjc') searchTerms = ["SJC (Miếng)", "SJC"];
    else if (typeKey === 'nhan_9999') searchTerms = ["SJC (Nhẫn)", "PNJ (Nhẫn)", "Nhẫn"];
    else if (typeKey === 'jewelry') searchTerms = ["PNJ (Nhẫn)", "Nhẫn"];
    else searchTerms = ["SJC"];

    for (const term of searchTerms) {
      const match = prices.find(p => p.type.includes(term));
      if (match && match.buy) {
        return match.buy / 10;
      }
    }
    return 8200000;
  };

  Object.entries(holdingsByType).forEach(([type, qty]) => {
    if (qty > 0) {
      totalAssetValue += qty * findBuyPricePerChi(type);
    }
  });

  // Calculate Breakdown Values
  const avgMarketPricePerChi = totalQuantity > 0 ? totalAssetValue / totalQuantity : 0;
  const buyValue = breakdown ? breakdown.buyQty * avgMarketPricePerChi : 0;
  const giftValue = breakdown ? breakdown.giftQty * avgMarketPricePerChi : 0;

  const buyPL = buyValue - (breakdown?.buyCost || 0);
  const buyPLPercent = (breakdown?.buyCost || 0) > 0 ? (buyPL / breakdown.buyCost) * 100 : 0;

  // Keep reference SJC Miếng Price for UI display
  const profitLoss = totalAssetValue - totalInvested;

  return (
    <div className="flex flex-col min-h-screen pb-12">
      <div className="container mx-auto max-w-7xl px-4 md:px-8 py-6 flex flex-col gap-8">
        {/* Compact Header Section with Asset Stats */}
        <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          {/* 1. Header Top (Mobile): User Info */}
          <div className="min-w-0 md:flex-none">
            <p className="text-xs font-medium text-muted-foreground">Chào mừng,</p>
            <h2 className="text-lg font-bold truncate pr-2" title={user?.displayName || "Nhà đầu tư"}>
              {user ? user.displayName : "Nhà đầu tư"}
            </h2>
          </div>

          {/* 2. Middle (Mobile): Action Button (Full Width) | Right (Desktop) */}
          <div className="w-full md:w-auto md:order-3">
            {!user ? (
              <Button onClick={login} className="w-full md:w-auto shadow-lg shadow-primary/20">
                Bắt đầu <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <TransactionDialog
                trigger={
                  <Button className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                    <Plus className="mr-2 h-4 w-4" /> Thêm giao dịch
                  </Button>
                }
              />
            )}
          </div>

          {/* 3. Bottom (Mobile): Stats Stacked | Center (Desktop) */}
          <div className="flex flex-col gap-3 border-t pt-4 md:border-t-0 md:pt-0 md:flex-row md:items-center md:gap-8 md:order-2 md:px-8">
            {/* Total Asset */}
            <div className="text-center md:text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tổng Tài Sản</p>
              <p className="text-xl font-bold text-primary sm:text-2xl truncate">
                {totalAssetValue.toLocaleString('vi-VN')} <span className="text-sm font-normal text-muted-foreground">₫</span>
              </p>
            </div>

            {/* Divider (Desktop Only) */}
            <div className="hidden md:block h-8 w-px bg-border/50"></div>

            {/* Profit/Loss */}
            <div className="text-center md:text-left">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Lợi Nhuận</p>
              <div className={`flex items-center justify-center md:justify-start gap-1 font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profitLoss >= 0 ? <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" /> : <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 rotate-180 shrink-0" />}
                <span className="text-xl sm:text-2xl truncate">{Math.abs(profitLoss).toLocaleString('vi-VN')} <span className="text-sm font-normal">₫</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Market Prices Section */}
        <MarketPriceBoard prices={prices} loading={false} />

        {/* 2. Portfolio Breakdown */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Investment Portfolio */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Vàng Tích Sản (Mua)</h3>
                <p className="text-sm text-muted-foreground">Tự đầu tư</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Khối lượng</p>
                <p className="text-xl font-bold">{breakdown?.buyQty.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">Chỉ</span></p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vốn đầu tư</p>
                <p className="text-xl font-bold">{breakdown?.buyCost.toLocaleString('vi-VN')} ₫</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Giá trị hiện tại</p>
                <p className="text-xl font-bold text-primary">{buyValue.toLocaleString('vi-VN')} ₫</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lợi nhuận</p>
                <p className={`text-xl font-bold ${buyPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {buyPL >= 0 ? '+' : ''}{buyPL.toLocaleString('vi-VN')} ₫
                  <span className="text-xs ml-1 font-normal block">({buyPLPercent.toFixed(1)}%)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Gift Portfolio */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <PiggyBank className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Vàng Được Tặng</h3>
                <p className="text-sm text-muted-foreground">Quà cưới, biếu tặng...</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Khối lượng</p>
                <p className="text-xl font-bold">{breakdown?.giftQty.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">Chỉ</span></p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vốn gốc</p>
                <p className="text-xl font-bold">0 ₫</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Giá trị tài sản</p>
                <p className="text-2xl font-bold text-purple-600">{giftValue.toLocaleString('vi-VN')} ₫</p>
                <p className="text-xs text-muted-foreground mt-1">Lãi ròng 100%</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Transaction History Section */}
        <div className="mt-8">
          <TransactionHistory transactions={transactions} />
        </div>
      </div>

      {/* Sticky Footer Ticker */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <PriceTicker />
      </div>
    </div>
  );
}
