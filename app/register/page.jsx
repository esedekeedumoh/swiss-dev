"use client";

import { ArrowLeft, Check, Github, LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import supabase from "@/lib/supabaseClient";

const oauthProviders = [
    { id: "google", label: "Google" },
    { id: "github", label: "GitHub" },
];

function RegisterContent() {
    const searchParams = useSearchParams();
    const plan = searchParams.get("plan");
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const signInWithProvider = async (provider) => {
        setError("");
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        if (oauthError) setError(oauthError.message);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        const formData = new FormData(event.currentTarget);
        if (formData.get("password") !== formData.get("confirmPassword")) {
            setError("Passwords do not match.");
            return;
        }
        const { error: signUpError } = await supabase.auth.signUp({
            email: formData.get("email"),
            password: formData.get("password"),
            options: {
                data: { full_name: formData.get("name") },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (signUpError) {
            setError(signUpError.message);
            return;
        }
        setSubmitted(true);
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#f5f6f3] px-6 py-12 text-[#17231e] swiss-grid">
            <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-[#163b2d]/15 bg-white shadow-2xl shadow-[#163b2d]/10 md:grid-cols-[.8fr_1.2fr]">
                <aside className="hidden bg-[#163b2d] p-9 text-white md:block"><Link href="/" className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 p-1"><img src="/logo.svg.png.png" alt="Swiss Dev logo" className="h-full w-full object-contain" /></span><b>Swiss Dev</b></Link><div className="mt-28"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#d8f36a]">{plan ? `${plan} plan selected` : "Desktop-first development"}</p><h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-.05em]">Your workspace is waiting.</h1><ul className="mt-8 space-y-4 text-sm text-white/70"><li className="flex gap-2"><Check className="h-4 w-4 text-[#d8f36a]" /> Agents beside your code</li><li className="flex gap-2"><Check className="h-4 w-4 text-[#d8f36a]" /> Live preview while you build</li><li className="flex gap-2"><Check className="h-4 w-4 text-[#d8f36a]" /> A workspace that stays yours</li></ul></div></aside>
                <section className="p-7 sm:p-12"><Link href="/" className="mb-12 inline-flex items-center gap-2 text-sm text-[#68776f]"><ArrowLeft className="h-4 w-4" /> Back to Swiss Dev</Link>{submitted ? <div className="py-12"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#e5f1b1] text-[#163b2d]"><Check /></div><h2 className="text-3xl font-semibold tracking-[-.04em]">Check your inbox.</h2><p className="mt-3 text-sm leading-6 text-[#68776f]">Confirm your email address to finish creating your Swiss Dev account.</p></div> : <><p className="text-xs font-bold uppercase tracking-[.18em] text-[#68776f]">Create your account</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.05em]">Start building with Swiss Dev.</h2><form onSubmit={handleSubmit} className="mt-8 space-y-4"><label className="block text-sm font-medium">Name<div className="mt-2 flex items-center gap-3 rounded-lg border border-[#163b2d]/15 px-3 py-3"><UserRound className="h-4 w-4 text-[#91a097]" /><input name="name" required className="w-full bg-transparent text-sm outline-none" placeholder="Your name" /></div></label><label className="block text-sm font-medium">Email<div className="mt-2 flex items-center gap-3 rounded-lg border border-[#163b2d]/15 px-3 py-3"><Mail className="h-4 w-4 text-[#91a097]" /><input name="email" required type="email" className="w-full bg-transparent text-sm outline-none" placeholder="you@example.com" /></div></label><label className="block text-sm font-medium">Password<div className="mt-2 flex items-center gap-3 rounded-lg border border-[#163b2d]/15 px-3 py-3"><LockKeyhole className="h-4 w-4 text-[#91a097]" /><input name="password" required minLength={8} type="password" className="w-full bg-transparent text-sm outline-none" placeholder="At least 8 characters" /></div></label><label className="block text-sm font-medium">Confirm password<div className="mt-2 flex items-center gap-3 rounded-lg border border-[#163b2d]/15 px-3 py-3"><LockKeyhole className="h-4 w-4 text-[#91a097]" /><input name="confirmPassword" required minLength={8} type="password" className="w-full bg-transparent text-sm outline-none" placeholder="Repeat your password" /></div></label>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<button className="w-full rounded-lg bg-[#163b2d] py-3 text-sm font-semibold text-white">Create account</button></form><div className="my-6 flex items-center gap-3 text-xs text-[#91a097]"><span className="h-px flex-1 bg-[#163b2d]/10" /> or <span className="h-px flex-1 bg-[#163b2d]/10" /></div><div className="grid gap-2 sm:grid-cols-3">{oauthProviders.map(({ id, label }) => <button key={id} onClick={() => signInWithProvider(id)} className="flex items-center justify-center gap-2 rounded-lg border border-[#163b2d]/15 py-3 text-sm font-semibold text-[#496457] hover:bg-[#f5f6f3]">{id === "github" ? <Github className="h-4 w-4" /> : <span className="text-xs font-bold">{id === "google" ? "G" : "GL"}</span>}{label}</button>)}</div><p className="mt-6 text-center text-xs text-[#91a097]">Already have an account? <Link href="/sign-in" className="font-semibold text-[#163b2d]">Sign in</Link></p></>}</section>
            </div>
        </main>
    );
}

export default function RegisterPage() {
    return <Suspense fallback={<main className="min-h-screen bg-[#f5f6f3]" />}><RegisterContent /></Suspense>;
}
