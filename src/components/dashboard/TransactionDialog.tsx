"use client";

import { usePortfolioStore, Transaction } from "@/store/portfolioStore";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface TransactionDialogProps {
    existingTransaction?: Transaction;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function TransactionDialog({ existingTransaction, trigger }: TransactionDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const { addTransaction, updateTransaction } = usePortfolioStore();

    // Form State
    const [type, setType] = useState<"buy" | "sell" | "gift_in" | "gift_out">("buy");
    const [goldType, setGoldType] = useState("sjc");
    const [quantity, setQuantity] = useState("");
    const [price, setPrice] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [note, setNote] = useState("");

    // Load data if editing
    useEffect(() => {
        if (existingTransaction) {
            setType(existingTransaction.type);
            setGoldType(existingTransaction.goldType);
            setQuantity(existingTransaction.quantity.toString());
            setPrice(existingTransaction.price.toString());
            setDate(existingTransaction.date);
            setNote(existingTransaction.note || "");
        }
    }, [existingTransaction, open]);

    const handleSubmit = async () => {
        if (!quantity || (!price && !type.startsWith('gift'))) {
            toast.error("Vui lòng nhập đầy đủ thông tin");
            return;
        }

        setLoading(true);

        const priceClean = type.startsWith('gift') ? 0 : parseFloat(price.replace(/,/g, ""));
        const quantityClean = parseFloat(quantity);

        const transactionData = {
            type,
            goldType,
            quantity: quantityClean,
            price: priceClean,
            date,
            totalValue: quantityClean * priceClean,
            note: note.trim()
        };

        try {
            if (existingTransaction) {
                // Edit Mode
                await updateTransaction(existingTransaction.id, transactionData);
                toast.success("Cập nhật giao dịch thành công!");
            } else {
                // Add Mode
                await addTransaction(transactionData, user?.uid);
                toast.success(type === "buy" ? "Mua vàng thành công!" : "Bán vàng thành công!");
            }

            setOpen(false);
            if (!existingTransaction) {
                // Only reset if adding
                setQuantity("");
                setPrice("");
                setNote("");
            }
        } catch (error) {
            console.error("Transaction Error:", error);
            toast.error("Có lỗi xảy ra khi lưu dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" /> Thêm giao dịch
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{existingTransaction ? "Sửa Giao Dịch" : "Giao dịch Vàng"}</DialogTitle>
                    <DialogDescription>
                        {existingTransaction ? "Cập nhật thông tin giao dịch" : "Nhập thông tin mua/bán vàng (Đơn vị: CHỈ)"}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={type.startsWith('gift') ? 'gift' : type} onValueChange={(v) => {
                    // Explicitly cast or handle string value
                    if (v === 'buy') setType('buy');
                    else if (v === 'sell') setType('sell');
                    else setType('gift_in');
                }} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="buy">Mua vào</TabsTrigger>
                        <TabsTrigger value="sell">Bán ra</TabsTrigger>
                        <TabsTrigger value="gift">Quà tặng</TabsTrigger>
                    </TabsList>

                    <div className="space-y-4 py-4">
                        {/* Gift Direction Selector */}
                        {type.startsWith('gift') && (
                            <div className="flex gap-2 mb-2 p-1 bg-secondary/50 rounded-lg">
                                <Button
                                    variant={type === 'gift_in' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="flex-1 h-7 text-xs"
                                    onClick={() => setType('gift_in')}
                                >
                                    Được Tặng (Nhập)
                                </Button>
                                <Button
                                    variant={type === 'gift_out' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="flex-1 h-7 text-xs"
                                    onClick={() => setType('gift_out')}
                                >
                                    Tặng/Biếu (Xuất)
                                </Button>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Loại vàng</Label>
                            <Select value={goldType} onValueChange={setGoldType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn loại vàng" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sjc">Vàng miếng SJC</SelectItem>
                                    <SelectItem value="nhan_9999">Nhẫn tròn 9999</SelectItem>
                                    <SelectItem value="jewelry">Vàng trang sức</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Khối lượng (CHỈ)</Label>
                                <Input
                                    type="number"
                                    placeholder="5.0"
                                    step="0.1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Giá (VNĐ/CHỈ)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={type.startsWith('gift') ? '0' : price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    disabled={type.startsWith('gift')}
                                    className={type.startsWith('gift') ? 'bg-muted text-muted-foreground' : ''}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Ngày giao dịch</Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Ghi chú (Tùy chọn)</Label>
                            <Input
                                placeholder={type === 'gift_in' ? "VD: Cưới, Sinh nhật..." : "VD: Tặng mẹ, Quỹ..."}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>

                        <Button
                            onClick={handleSubmit}
                            className={`w-full text-white ${type === 'buy' ? 'bg-green-600 hover:bg-green-700' :
                                type === 'sell' ? 'bg-red-600 hover:bg-red-700' :
                                    'bg-purple-600 hover:bg-purple-700'
                                }`}
                            disabled={loading}
                        >
                            {loading ? "Đang xử lý..." : `Xác nhận ${type === 'buy' ? 'MUA' :
                                type === 'sell' ? 'BÁN' :
                                    type === 'gift_in' ? 'NHẬP QUÀ' : 'XUẤT QUÀ'
                                }`}
                        </Button>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
