"use client";

import Link from "next/link";
import { UserNav } from "./UserNav";
import { Coins } from "lucide-react";

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4 md:px-8">
                <div className="flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-2">
                        <Coins className="h-6 w-6 text-primary" />
                    </div>
                    <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
                        Gold<span className="text-primary">Tracker</span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <UserNav />
                </div>
            </div>
        </header>
    );
}
