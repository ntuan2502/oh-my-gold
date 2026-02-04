"use client";

import { PriceTicker } from "@/components/dashboard/PriceTicker";
import { TransactionDialog } from "@/components/dashboard/TransactionDialog";
import { Button } from "@/components/ui/button";
import { MarketPriceBoard } from "@/components/dashboard/MarketPriceBoard";
import { GoldPriceChart } from "@/components/dashboard/GoldPriceChart";
import { TransactionHistory } from "@/components/dashboard/TransactionHistory";
import { ArrowRight, Coins, TrendingUp, PiggyBank, Plus } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePortfolioStore } from "@/store/portfolioStore";
import { useGoldPrice } from "@/hooks/useGoldPrice";
import { useGoldHistory } from "@/hooks/useGoldHistory";
import { subDays, format } from "date-fns";

export default function Home() {
  const { user, login } = useAuth();
  const { getHoldings, transactions, fetchTransactions } = usePortfolioStore();
  const { prices } = useGoldPrice();
  const { fetchAndSyncHistory, historyData, loading: historyLoading } = useGoldHistory();

  // Load Transactions on User Change
  useEffect(() => {
    if (user?.uid) {
      fetchTransactions(user.uid);
    }
  }, [user, fetchTransactions]);

  // Sync Gold History (Client-side)
  useEffect(() => {
    // Sync last 30 days on session start
    // In production, we might want to check if sync is needed (timestamp in local storage)
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);

    const to = format(today, 'dd/MM/yyyy');
    const from = format(thirtyDaysAgo, 'dd/MM/yyyy');

    fetchAndSyncHistory(from, to);
  }, [fetchAndSyncHistory]);

  // Handle Chart Range Change
  const handleRangeChange = (from: string, to: string) => {
    fetchAndSyncHistory(from, to);
  };

  // Calculate Dynamic Data
  const { totalInvested, breakdown } = getHoldings(); // Quantity is in Chi

  // Valuation Logic: 
  // Calculate value by matching specific Type/Brand from transactions to current Market Buy Price.

  const investMap: Record<string, number> = {};
  const giftMap: Record<string, number> = {};

  transactions.forEach(t => {
    const brand = t.brand || "SJC";
    const key = `${t.goldType}:${brand}`;

    if (t.type === 'buy') investMap[key] = (investMap[key] || 0) + t.quantity;
    else if (t.type === 'sell') investMap[key] = (investMap[key] || 0) - t.quantity;
    else if (t.type === 'gift_in') giftMap[key] = (giftMap[key] || 0) + t.quantity;
    else if (t.type === 'gift_out') giftMap[key] = (giftMap[key] || 0) - t.quantity;
  });

  // Helper to find price by Brand and Type
  const findBuyPricePerChi = (key: string) => {
    const [goldType, brand] = key.split(":");
    let searchTerm = "";

    if (goldType === "bar") searchTerm = `${brand} (Miếng)`;
    else if (goldType === "ring_9999") searchTerm = `${brand} (Nhẫn)`;

    // 1. Try Specific Brand Search
    let match = prices.find(p => p.type.includes(searchTerm));
    if (match && match.buy) return match.buy / 10;

    // 2. Fallback: Try generic Type search
    if (goldType === "bar") match = prices.find(p => p.type.includes("SJC (Miếng)"));
    else if (goldType === "ring_9999") match = prices.find(p => p.type.includes("SJC (Nhẫn)") || p.type.includes("Nhẫn"));

    if (match && match.buy) return match.buy / 10;
    return 0;
  };

  let buyValueRaw = 0;
  Object.entries(investMap).forEach(([key, qty]) => {
    if (qty > 0) buyValueRaw += qty * findBuyPricePerChi(key);
  });

  let giftValueRaw = 0;
  Object.entries(giftMap).forEach(([key, qty]) => {
    if (qty > 0) giftValueRaw += qty * findBuyPricePerChi(key);
  });

  const totalAssetValue = buyValueRaw + giftValueRaw;

  // Calculate Breakdown Values
  // const avgMarketPricePerChi = totalQuantity > 0 ? totalAssetValue / totalQuantity : 0; // Legacy
  const buyValue = buyValueRaw;
  const giftValue = giftValueRaw;

  const buyPL = buyValue - (breakdown?.buyCost || 0);
  const buyPLPercent = (breakdown?.buyCost || 0) > 0 ? (buyPL / breakdown.buyCost) * 100 : 0;

  // Keep reference SJC Miếng Price for UI display
  const profitLoss = totalAssetValue - totalInvested;

  return (
    <div className="flex flex-col min-h-screen pb-12">
      <div className="container mx-auto max-w-7xl px-4 md:px-8 py-6 flex flex-col gap-8">
        {/* Compact Header Section with Asset Stats */}
        <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* 1. Header Top (Mobile): User Info */}
          <div className="min-w-0 lg:flex-none">
            <p className="text-xs font-medium text-muted-foreground">Chào mừng,</p>
            <h2 className="text-lg font-bold truncate pr-2" title={user?.displayName || "Nhà đầu tư"}>
              {user ? user.displayName : "Nhà đầu tư"}
            </h2>
          </div>

          {/* 2. Middle (Mobile): Action Button (Full Width) | Right (Desktop) */}
          <div className="w-full lg:w-auto lg:order-3">
            {!user ? (
              <Button onClick={login} className="w-full lg:w-auto shadow-lg shadow-primary/20">
                Bắt đầu <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <TransactionDialog
                trigger={
                  <Button className="w-full lg:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                    <Plus className="mr-2 h-4 w-4" /> Thêm giao dịch
                  </Button>
                }
              />
            )}
          </div>

          {/* 3. Bottom (Mobile): Stats Stacked | Center (Desktop) */}
          <div className="flex flex-col gap-3 border-t pt-4 lg:border-t-0 lg:pt-0 lg:flex-row lg:items-center lg:gap-8 lg:order-2 lg:px-8">
            {/* Total Asset */}
            <div className="text-center lg:text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tổng Tài Sản</p>
              <p className="text-xl font-bold text-primary truncate">
                {Math.round(totalAssetValue).toLocaleString('vi-VN')} <span className="text-sm font-normal text-muted-foreground">₫</span>
              </p>
            </div>

            {/* Divider (Desktop Only) */}
            <div className="hidden lg:block h-8 w-px bg-border/50"></div>

            {/* Profit/Loss */}
            <div className="text-center lg:text-left">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Lợi Nhuận</p>
              <div className={`flex items-center justify-center lg:justify-start gap-1 font-bold ${profitLoss > 0 ? 'text-green-600' : profitLoss < 0 ? 'text-red-600' : 'text-foreground'}`}>
                <span className="text-xl truncate">
                  {profitLoss > 0 ? '+' : ''}{Math.round(profitLoss).toLocaleString('vi-VN')} <span className="text-sm font-normal">₫</span>
                </span>
                {profitLoss > 0 && <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />}
                {profitLoss < 0 && <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 rotate-180 shrink-0" />}
              </div>
            </div>
          </div>
        </div>

        {/* 1. Market Prices Section */}
        <MarketPriceBoard prices={prices} loading={false} />

        {/* 2. Charts */}
        <GoldPriceChart
          data={historyData}
          loading={historyLoading}
          onRangeChange={handleRangeChange}
          transactions={transactions}
          currentBarPrice={(prices.find(p => p.type.includes("SJC (Miếng)"))?.buy || 0) / 10}
          currentRingPrice={(prices.find(p => p.type.includes("Nhẫn"))?.buy || 0) / 10}
        />

        {/* 3. Portfolio Breakdown */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Investment Portfolio */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
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
                <p className="text-xl font-bold">{breakdown?.buyQty.toFixed(1).replace('.', ',')} <span className="text-sm font-normal text-muted-foreground">Chỉ</span></p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vốn đầu tư</p>
                <p className="text-xl font-bold">{Math.round(breakdown?.buyCost || 0).toLocaleString('vi-VN')} ₫</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Giá trị hiện tại</p>
                <p className="text-xl font-bold text-primary">{Math.round(buyValue).toLocaleString('vi-VN')} ₫</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lợi nhuận</p>
                <div className={`flex flex-col items-start ${buyPL > 0 ? 'text-green-600' : buyPL < 0 ? 'text-red-600' : 'text-foreground'}`}>
                  <span className="text-xl font-bold">
                    {buyPL > 0 ? '+' : ''}{Math.round(buyPL).toLocaleString('vi-VN')} ₫
                  </span>
                  <div className="flex items-center gap-1 text-xs font-normal opacity-80">
                    {buyPL > 0 && <TrendingUp className="h-3 w-3" />}
                    {buyPL < 0 && <TrendingUp className="h-3 w-3 rotate-180" />}
                    <span>({buyPLPercent.toFixed(0)}%)</span>
                  </div>
                </div>
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
                <p className="text-xl font-bold">{breakdown?.giftQty.toFixed(1).replace('.', ',')} <span className="text-sm font-normal text-muted-foreground">Chỉ</span></p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vốn gốc</p>
                <p className="text-xl font-bold">0 ₫</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Giá trị tài sản</p>
                <p className="text-xl font-bold text-purple-600">{Math.round(giftValue).toLocaleString('vi-VN')} ₫</p>
                <p className="text-xs text-muted-foreground mt-1">Lãi ròng 100%</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Transaction History Section */}
        <div>
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
