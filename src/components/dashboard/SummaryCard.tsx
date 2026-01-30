import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SummaryCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    className?: string;
}

export function SummaryCard({ title, value, icon: Icon, trend, trendUp, className }: SummaryCardProps) {
    return (
        <Card className={cn("border-l-4", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {trend && (
                    <p className={cn("text-xs font-medium mt-1", trendUp ? "text-green-600" : "text-red-600")}>
                        {trend}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
