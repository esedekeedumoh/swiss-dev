"use client";

import { Github, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import supabase from "@/lib/supabaseClient";

const getRedirectUrl = () => `${window.location.origin}/auth/callback`;

export default function SignInPage() {
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const signInWithProvider = async (provider) => {
        setError("");
        setBusy(true);
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: getRedirectUrl() },
        });
        if (oauthError) {
            setBusy(false);
            setError(oauthError.message);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setBusy(true);
        const formData = new FormData(event.currentTarget);
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.get("email"),
            password: formData.get("password"),
        });
        if (signInError) setError(signInError.message);
        else window.location.assign("/auth/callback");
        setBusy(false);
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#0b0d12] px-6 text-white">
            <section className="w-full max-w-md border border-white/10 bg-[#131720] p-8 shadow-2xl sm:p-10">
                <div className="mb-10 flex items-center gap-3">
                    <img src="/logo.svg.png.png" alt="Swiss Dev logo" className="h-9 w-9 object-contain" />
                    <span className="text-sm font-semibold tracking-wide">Swiss Dev</span>
                </div>
                <p className="text-xs uppercase tracking-[.2em] text-[#b9e55b]">Welcome back</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in to Swiss Dev</h1>
                <p className="mt-3 text-sm leading-6 text-gray-400">Use your Swiss Dev account to open your workspace.</p>
                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <label className="block text-sm text-gray-300">Email<div className="mt-2 flex items-center gap-3 border border-white/10 bg-[#0c0f15] px-3 py-3"><Mail className="h-4 w-4 text-gray-500" /><input name="email" required type="email" className="w-full bg-transparent text-sm outline-none" placeholder="you@example.com" /></div></label>
                    <label className="block text-sm text-gray-300">Password<div className="mt-2 flex items-center gap-3 border border-white/10 bg-[#0c0f15] px-3 py-3"><LockKeyhole className="h-4 w-4 text-gray-500" /><input name="password" required type="password" className="w-full bg-transparent text-sm outline-none" placeholder="Your password" /></div></label>
                    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
                    <button disabled={busy} className="w-full bg-[#b9e55b] py-3 text-sm font-semibold text-[#17231e] disabled:opacity-60">{busy ? "Signing in..." : "Sign in"}</button>
                </form>
                <div className="my-6 flex items-center gap-3 text-xs text-gray-600"><span className="h-px flex-1 bg-white/10" />OR<span className="h-px flex-1 bg-white/10" /></div>
                <div className="grid grid-cols-2 gap-3">
                    <button type="button" disabled={busy} onClick={() => signInWithProvider("google")} className="flex items-center justify-center gap-2 border border-white/10 bg-[#0c0f15] px-3 py-3 text-sm text-gray-200 hover:border-white/30 disabled:opacity-60"><span className="font-bold text-red-400">G</span> Google</button>
                    <button type="button" disabled={busy} onClick={() => signInWithProvider("github")} className="flex items-center justify-center gap-2 border border-white/10 bg-[#0c0f15] px-3 py-3 text-sm text-gray-200 hover:border-white/30 disabled:opacity-60"><Github className="h-4 w-4" /> GitHub</button>
                </div>
                <p className="mt-8 text-center text-sm text-gray-500">New to Swiss Dev? <Link href="/register" className="text-[#b9e55b] hover:underline">Create an account</Link></p>
            </section>
        </main>
    );
}
