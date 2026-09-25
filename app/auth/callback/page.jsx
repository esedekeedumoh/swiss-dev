"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [complete, setComplete] = useState(false);

    useEffect(() => {
        const completeAuth = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get("code");
            if (params.get("complete") === "1") {
                setComplete(true);
                return;
            }
            if (code) {
                const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                if (exchangeError) {
                    setError(exchangeError.message);
                    return;
                }
            }
            setComplete(true);
        };
        completeAuth();
    }, [router]);

    return <main className="flex min-h-screen items-center justify-center bg-[#0b0d12] text-white"><div className="text-center">{error ? <><h1 className="text-xl font-semibold">Sign-in failed</h1><p className="mt-2 text-sm text-red-400">{error}</p></> : complete ? <><h1 className="text-2xl font-semibold">You are signed in.</h1><p className="mt-3 text-sm text-gray-400">Return to Swiss Dev to open your workspace.</p><button type="button" onClick={() => router.replace("/")} className="mt-7 inline-flex bg-[#b9e55b] px-5 py-3 text-sm font-semibold text-[#17231e]">Return to Swiss</button></> : <><LoaderCircle className="mx-auto h-8 w-8 animate-spin" /><p className="mt-3 text-sm">Completing sign-in...</p></>}</div></main>;
}
