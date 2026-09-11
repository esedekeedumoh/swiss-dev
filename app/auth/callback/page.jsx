"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
    const router = useRouter();
    const [error, setError] = useState("");

    useEffect(() => {
        const completeAuth = async () => {
            const code = new URLSearchParams(window.location.search).get("code");
            if (code) {
                const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                if (exchangeError) {
                    setError(exchangeError.message);
                    return;
                }
            }
            router.replace("/");
        };
        completeAuth();
    }, [router]);

    return <main className="flex min-h-screen items-center justify-center bg-[#f5f6f3] text-[#163b2d]"><div className="text-center">{error ? <><h1 className="text-xl font-semibold">Sign-in failed</h1><p className="mt-2 text-sm text-red-600">{error}</p></> : <><LoaderCircle className="mx-auto h-8 w-8 animate-spin" /><p className="mt-3 text-sm">Completing sign-in...</p></>}</div></main>;
}
