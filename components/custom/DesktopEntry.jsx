"use client";

import dynamic from "next/dynamic";
import { LogIn, ArrowRight } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { SessionContext } from "@/app/provider";
import Link from "next/link";

const Workspace = dynamic(() => import("@/app/(main)/workspace/[id]/page"), { ssr: false });

export default function DesktopEntry() {
    const { session } = useContext(SessionContext);
    const [ready, setReady] = useState(false);

    useEffect(() => setReady(true), []);

    if (!ready) return <main className="min-h-screen bg-[#0b0d12]" />;

    if (!session) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#0b0d12] text-white">
                <Link href="/sign-in" className="flex items-center gap-3 bg-[#b9e55b] px-6 py-4 text-sm font-semibold text-[#17231e] transition hover:bg-[#d0f47e]">
                    <LogIn className="h-4 w-4" /> Sign in to Swiss Dev
                </Link>
            </main>
        );
    }

    return <Workspace />;
}
