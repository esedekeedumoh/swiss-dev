"use client";

import { useState } from "react";
import {
    Bug,
    CheckCircle2,
    Files,
    GitBranch,
    Globe2,
    Package,
    Play,
    Search,
    Settings2,
    TerminalSquare,
    X,
} from "lucide-react";

const activities = [
    { label: "Explorer", icon: Files },
    { label: "Search", icon: Search },
    { label: "Source Control", icon: GitBranch },
    { label: "Run and Debug", icon: Play },
    { label: "Extensions", icon: Package },
    { label: "GitHub Actions", icon: CheckCircle2 },
];

export function ActivityBar({ active, onChange }) {
    return (
        <aside className="flex w-12 shrink-0 flex-col items-center justify-between border-r border-white/10 bg-[#090b10] py-3 text-gray-500">
            <div className="flex flex-col items-center gap-2">
                {activities.map(({ label, icon: Icon }) => (
                    <button
                        key={label}
                        type="button"
                        title={label}
                        onClick={() => onChange(label)}
                        className={`relative flex h-10 w-10 items-center justify-center border-l-2 transition-colors ${active === label ? "border-[#b9e55b] text-white" : "border-transparent hover:text-gray-200"}`}
                    >
                        <Icon className="h-5 w-5" />
                    </button>
                ))}
            </div>
            <div className="flex flex-col items-center gap-2">
                <button type="button" title="Integrated Browser" className="flex h-10 w-10 items-center justify-center text-gray-500 hover:text-white"><Globe2 className="h-5 w-5" /></button>
                <button type="button" title="Settings" className="flex h-10 w-10 items-center justify-center text-gray-500 hover:text-white"><Settings2 className="h-5 w-5" /></button>
            </div>
        </aside>
    );
}

export function BottomPanel() {
    const [active, setActive] = useState("Terminal");
    const tabs = ["Problems", "Output", "Debug Console", "Terminal", "Ports"];
    return (
        <section className="flex h-36 shrink-0 flex-col border-t border-white/10 bg-[#0d1016] text-xs text-gray-400">
            <div className="flex h-9 items-center gap-5 border-b border-white/10 px-4">
                {tabs.map((tab) => (
                    <button key={tab} type="button" onClick={() => setActive(tab)} className={`h-full border-b-2 px-1 text-[11px] ${active === tab ? "border-[#b9e55b] text-white" : "border-transparent hover:text-gray-200"}`}>{tab}</button>
                ))}
                <button type="button" title="Close panel" className="ml-auto text-gray-600 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex flex-1 items-start gap-3 overflow-auto px-4 py-3 font-mono text-[11px]">
                {active === "Problems" && <><Bug className="h-4 w-4 text-[#f59e0b]" /><span>No problems detected in the current workspace.</span></>}
                {active === "Output" && <span>Swiss Dev output will appear here.</span>}
                {active === "Debug Console" && <span>Debug console ready.</span>}
                {active === "Terminal" && <><TerminalSquare className="h-4 w-4 text-[#b9e55b]" /><span className="text-gray-300">swiss-dev <span className="text-gray-600">$</span> Ready for commands</span></>}
                {active === "Ports" && <span>No forwarded ports.</span>}
            </div>
        </section>
    );
}
