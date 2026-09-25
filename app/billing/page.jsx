"use client";

import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useContext, useEffect, useState } from "react";
import { SessionContext } from "@/app/provider";
import supabase from "@/lib/supabaseClient";

function BillingContent() {
    const { session } = useContext(SessionContext);
    const searchParams = useSearchParams();
    const router = useRouter();
    const plan = searchParams.get("plan");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (plan && !["builder", "pro"].includes(plan)) router.replace("/");
    }, [plan, router]);

    const startPayment = async () => {
        setLoading(true); setError("");
        try {
            const response = await fetch("/api/paystack/initialize", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Unable to start payment");
            window.location.assign(data.authorization_url);
        } catch (requestError) { setError(requestError.message); setLoading(false); }
    };

    if (!session) return <main className="flex min-h-screen items-center justify-center bg-[#f5f6f3] px-6 text-[#163b2d] swiss-grid"><div className="w-full max-w-md rounded-2xl border border-[#163b2d]/15 bg-white p-8 text-center shadow-xl"><LockKeyhole className="mx-auto h-8 w-8" /><h1 className="mt-5 text-2xl font-semibold">Sign in to continue</h1><p className="mt-2 text-sm text-[#68776f]">Your payment will be linked to your Swiss Dev account.</p><button onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/billing?plan=${plan}` } })} className="mt-6 w-full rounded-lg bg-[#163b2d] py-3 text-sm font-semibold text-white">Continue with Google</button></div></main>;
    return <main className="flex min-h-screen items-center justify-center bg-[#f5f6f3] px-6 text-[#163b2d] swiss-grid"><div className="w-full max-w-md rounded-2xl border border-[#163b2d]/15 bg-white p-8 shadow-xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#68776f]">Secure checkout</p><h1 className="mt-3 text-3xl font-semibold">{plan === "pro" ? "Pro" : "Builder"} plan</h1><p className="mt-2 text-sm text-[#68776f]">Monthly payment via Paystack. You are signed in as {session.user.email}.</p>{error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}<button disabled={loading} onClick={startPayment} className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-[#163b2d] py-3 text-sm font-semibold text-white disabled:opacity-60">{loading && <LoaderCircle className="h-4 w-4 animate-spin" />} Continue to payment</button></div></main>;
}

export default function BillingPage() {
    return <Suspense fallback={<main className="min-h-screen bg-[#f5f6f3]" />}><BillingContent /></Suspense>;
}