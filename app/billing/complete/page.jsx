"use client";

import { Check, LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useContext, useEffect, useState } from "react";
import { SessionContext } from "@/app/provider";

function CompleteContent() {
    const { session } = useContext(SessionContext);
    const searchParams = useSearchParams();
    const router = useRouter();
    const [error, setError] = useState("");
    useEffect(() => {
        if (!session) return;
        const reference = searchParams.get("reference");
        if (!reference) { setError("No payment reference was provided"); return; }
        fetch("/api/paystack/verify", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ reference }) }).then(async (response) => {
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Payment verification failed");
            router.replace("/");
        }).catch((verificationError) => setError(verificationError.message));
    }, [router, searchParams, session]);
    return <main className="flex min-h-screen items-center justify-center bg-[#f5f6f3] px-6 text-[#163b2d] swiss-grid"><div className="text-center">{error ? <><h1 className="text-xl font-semibold">Payment verification failed</h1><p className="mt-2 text-sm text-red-600">{error}</p></> : <><LoaderCircle className="mx-auto h-8 w-8 animate-spin" /><p className="mt-3 text-sm">Confirming your payment...</p></>}</div></main>;
}

export default function PaymentCompletePage() {
    return <Suspense fallback={<main className="min-h-screen bg-[#f5f6f3]" />}><CompleteContent /></Suspense>;
}