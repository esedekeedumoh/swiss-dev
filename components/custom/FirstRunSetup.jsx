"use client";

import React, { useContext, useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, FolderOpen, KeyRound, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import { AI_MODELS, ModelContext } from "@/context/ModelContext";

const SETUP_STORAGE_KEY = "swiss-dev-first-run-complete";
const SETTINGS_STORAGE_KEY = "swiss-dev-settings";

const steps = [
    { label: "Workspace", icon: FolderOpen },
    { label: "AI model", icon: Sparkles },
    { label: "Permissions", icon: ShieldCheck },
    { label: "Ready", icon: WandSparkles },
];

function FirstRunSetup({ onComplete }) {
    const { selectedModel, setSelectedModel } = useContext(ModelContext);
    const [step, setStep] = useState(0);
    const [workspaceName, setWorkspaceName] = useState("Untitled project");
    const [workspaceFolder, setWorkspaceFolder] = useState("~/Swiss projects");
    const [permissionMode, setPermissionMode] = useState("ask");
    const [theme, setTheme] = useState("dark");
    const [telemetry, setTelemetry] = useState(false);

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "null");
            if (saved) {
                setWorkspaceName(saved.workspaceName || "Untitled project");
                setWorkspaceFolder(saved.workspaceFolder || "~/Swiss projects");
                setPermissionMode(saved.permissionMode || "ask");
                setTheme(saved.theme || "dark");
                setTelemetry(Boolean(saved.telemetry));
            }
        } catch {
            // Start with defaults when stored settings are unavailable.
        }
    }, []);

    const finishSetup = () => {
        const settings = { workspaceName, workspaceFolder, permissionMode, theme, telemetry };
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        localStorage.setItem(SETUP_STORAGE_KEY, "true");
        onComplete(settings);
    };

    const selectedModelDetails = AI_MODELS.find((model) => model.id === selectedModel) || AI_MODELS[0];

    return (
        <main className="relative z-[100] flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0d12] px-5 py-10 text-white">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#4285f41c_1px,transparent_1px),linear-gradient(to_bottom,#34a85313_1px,transparent_1px)] bg-[size:28px_28px]" />
            <div className="relative w-full max-w-4xl overflow-hidden border border-white/10 bg-[#131720] shadow-2xl shadow-black/40 lg:grid lg:grid-cols-[230px_1fr]">
                <aside className="border-b border-white/10 bg-[#10131a] p-6 lg:border-b-0 lg:border-r">
                    <div className="mb-10 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center border border-[#b9e55b]/30 bg-[#b9e55b]/10 text-[#b9e55b]"><KeyRound className="h-4 w-4" /></div>
                        <div><p className="text-sm font-semibold">Swiss Dev</p><p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">First launch</p></div>
                    </div>
                    <nav className="grid grid-cols-4 gap-2 lg:block lg:space-y-5">
                        {steps.map((item, index) => {
                            const Icon = item.icon;
                            return <div key={item.label} className={`flex items-center gap-3 text-xs ${index === step ? "text-[#b9e55b]" : index < step ? "text-gray-300" : "text-gray-600"}`}><span className={`flex h-7 w-7 items-center justify-center border ${index < step ? "border-[#b9e55b]/40 bg-[#b9e55b]/10" : "border-current/30"}`}>{index < step ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}</span><span className="hidden lg:inline">{item.label}</span></div>;
                        })}
                    </nav>
                </aside>

                <section className="flex min-h-[520px] flex-col p-7 sm:p-10">
                    {step === 0 && <>
                        <p className="mb-3 text-xs uppercase tracking-[0.24em] text-[#b9e55b]">Welcome to your workspace</p>
                        <h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">Set up your build room.</h1>
                        <p className="mt-4 max-w-xl text-sm leading-6 text-gray-400">Choose where projects live and how they should appear when Swiss opens.</p>
                        <div className="mt-10 space-y-5">
                            <label className="block text-sm text-gray-300">Workspace name<input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} className="mt-2 w-full border border-white/10 bg-[#0c0f15] px-4 py-3 text-sm text-white outline-none transition focus:border-[#b9e55b]/60" placeholder="Untitled project" /></label>
                            <label className="block text-sm text-gray-300">Default project folder<div className="mt-2 flex"><input value={workspaceFolder} onChange={(event) => setWorkspaceFolder(event.target.value)} className="min-w-0 flex-1 border border-white/10 bg-[#0c0f15] px-4 py-3 text-sm text-white outline-none focus:border-[#b9e55b]/60" placeholder="~/Swiss projects" /><button type="button" title="Choose project folder" className="border-y border-r border-white/10 px-4 text-gray-400 hover:text-[#b9e55b]"><FolderOpen className="h-4 w-4" /></button></div></label>
                        </div>
                    </>}

                    {step === 1 && <>
                        <p className="mb-3 text-xs uppercase tracking-[0.24em] text-[#b9e55b]">Your AI teammate</p>
                        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Pick a default model.</h1>
                        <p className="mt-4 max-w-xl text-sm leading-6 text-gray-400">You can switch models anytime from the workspace header. API keys stay in the server environment and are never stored in this screen.</p>
                        <div className="mt-8 grid gap-3 sm:grid-cols-2">{AI_MODELS.map((model) => <button key={model.id} type="button" onClick={() => setSelectedModel(model.id)} className={`border p-4 text-left transition ${selectedModel === model.id ? "border-[#b9e55b] bg-[#b9e55b]/10" : "border-white/10 bg-[#0c0f15] hover:border-white/30"}`}><span className="block text-sm font-medium">{model.label}</span><span className="mt-1 block text-xs uppercase tracking-wider text-gray-500">{model.provider}</span></button>)}</div>
                        <div className="mt-5 flex items-center gap-3 border border-white/10 bg-[#0c0f15] p-4 text-xs text-gray-400"><KeyRound className="h-4 w-4 shrink-0 text-[#b9e55b]" />Configured server providers include Gemini, OpenAI, Claude, and Grok.</div>
                    </>}

                    {step === 2 && <>
                        <p className="mb-3 text-xs uppercase tracking-[0.24em] text-[#b9e55b]">Agent boundaries</p>
                        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">How much autonomy feels right?</h1>
                        <p className="mt-4 max-w-xl text-sm leading-6 text-gray-400">Swiss can prepare changes, or take care of routine edits while you stay in control.</p>
                        <div className="mt-9 space-y-3">{[{ id: "ask", title: "Ask before changes", description: "Review file edits and commands before they run." }, { id: "workspace", title: "Workspace actions", description: "Allow routine changes inside the open project." }, { id: "full", title: "Full autonomy", description: "Let the agent run approved project workflows end to end." }].map((option) => <button key={option.id} type="button" onClick={() => setPermissionMode(option.id)} className={`flex w-full items-start gap-4 border p-4 text-left transition ${permissionMode === option.id ? "border-[#b9e55b] bg-[#b9e55b]/10" : "border-white/10 bg-[#0c0f15] hover:border-white/30"}`}><span className={`mt-0.5 h-4 w-4 rounded-full border ${permissionMode === option.id ? "border-[#b9e55b] bg-[#b9e55b] shadow-[inset_0_0_0_3px_#0c0f15]" : "border-gray-600"}`} /><span><span className="block text-sm font-medium">{option.title}</span><span className="mt-1 block text-xs leading-5 text-gray-500">{option.description}</span></span></button>)}</div>
                    </>}

                    {step === 3 && <>
                        <p className="mb-3 text-xs uppercase tracking-[0.24em] text-[#b9e55b]">One last detail</p>
                        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Make it yours.</h1>
                        <p className="mt-4 max-w-xl text-sm leading-6 text-gray-400">These preferences can be changed later in settings.</p>
                        <div className="mt-9 space-y-5"><div><p className="mb-3 text-sm text-gray-300">Appearance</p><div className="grid grid-cols-2 gap-3">{["dark", "light"].map((item) => <button key={item} type="button" onClick={() => setTheme(item)} className={`border px-4 py-3 text-left text-sm capitalize ${theme === item ? "border-[#b9e55b] bg-[#b9e55b]/10" : "border-white/10 bg-[#0c0f15]"}`}>{item}</button>)}</div></div><label className="flex items-start gap-3 border border-white/10 bg-[#0c0f15] p-4 text-sm text-gray-300"><input type="checkbox" checked={telemetry} onChange={(event) => setTelemetry(event.target.checked)} className="mt-0.5 accent-[#b9e55b]" />Share anonymous diagnostics to help improve Swiss.</label><div className="border border-[#b9e55b]/20 bg-[#b9e55b]/5 p-4 text-xs leading-5 text-gray-400">You are set up with <span className="text-white">{selectedModelDetails.label}</span>, <span className="text-white">{permissionMode === "ask" ? "review-first permissions" : "workspace permissions"}</span>, and a <span className="text-white">{theme}</span> interface.</div></div>
                    </>}

                    <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-7"><button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0} className="flex items-center gap-2 px-2 py-2 text-sm text-gray-500 transition hover:text-white disabled:invisible"><ChevronLeft className="h-4 w-4" />Back</button>{step < steps.length - 1 ? <button type="button" onClick={() => setStep((current) => current + 1)} className="flex items-center gap-2 bg-[#b9e55b] px-5 py-3 text-sm font-semibold text-[#17231e] transition hover:bg-[#d0f47e]">Continue<ChevronRight className="h-4 w-4" /></button> : <button type="button" onClick={finishSetup} className="flex items-center gap-2 bg-[#b9e55b] px-5 py-3 text-sm font-semibold text-[#17231e] transition hover:bg-[#d0f47e]">Open workspace<ChevronRight className="h-4 w-4" /></button>}</div>
                </section>
            </div>
        </main>
    );
}

export { SETUP_STORAGE_KEY, SETTINGS_STORAGE_KEY };
export default FirstRunSetup;
