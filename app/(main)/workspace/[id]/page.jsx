"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import { Code } from "lucide-react";
import InstallSwissButton from "@/components/custom/InstallSwissButton";
import Header from "@/components/custom/Header";
import FirstRunSetup, { SETUP_STORAGE_KEY } from "@/components/custom/FirstRunSetup";

const DesktopOnlyGate = () => (
    <div className="hidden max-lg:flex fixed inset-0 z-[100] items-center justify-center bg-[#111318] p-6 text-center text-white">
        <div className="max-w-sm">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#b9e55b] font-black text-[#17231e]">S</div>
            <h1 className="text-2xl font-semibold">Swiss Dev is a desktop app</h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">Download the Windows or macOS app to open your development workspace.</p>
        </div>
    </div>
);

const ChatView = dynamic(() => import("@/components/custom/ChatView"), {
    ssr: false,
    loading: () => (
        <div className="animate-pulse rounded-lg border border-googleAnti-blue/20 bg-googleAnti-ink/60 h-full" />
    ),
});

const CodeView = dynamic(() => import("@/components/custom/CodeView"), {
    ssr: false,
    loading: () => (
        <div className="animate-pulse rounded-lg border border-googleAnti-blue/20 bg-googleAnti-ink/60 h-full" />
    ),
});

const BackgroundPattern = React.memo(() => (
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#4285f433_1px,transparent_1px),linear-gradient(to_bottom,#34a85326_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-1/2 top-0 h-[500px] w-[1000px] -translate-x-1/2 bg-[radial-gradient(circle_420px_at_50%_260px,#4285f44a,transparent)]" />
    </div>
));

BackgroundPattern.displayName = "BackgroundPattern";

import Sidebar from "@/components/custom/Sidebar";
import { ActivityBar, BottomPanel } from "@/components/custom/WorkspaceChrome";

const Workspace = () => {
    const [setupComplete, setSetupComplete] = useState(null);

    useEffect(() => {
        setSetupComplete(localStorage.getItem(SETUP_STORAGE_KEY) === "true");
    }, []);

    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch(() => {});
        }
    }, []);

    const [agentWidth, setAgentWidth] = useState(380);
    const [isDragging, setIsDragging] = useState(false);
    const [activeActivity, setActiveActivity] = useState("Explorer");

    if (setupComplete === null) {
        return <div className="min-h-screen bg-[#0b0d12]" />;
    }

    if (!setupComplete) {
        return <FirstRunSetup onComplete={() => setSetupComplete(true)} />;
    }

    const handleMouseDown = () => setIsDragging(true);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 300 && newWidth < 900) {
                setAgentWidth(newWidth);
            }
        };

        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div 
            className="h-screen w-screen bg-googleAnti-ink relative overflow-hidden flex"
            style={{ cursor: isDragging ? 'col-resize' : 'default' }}
        >
            <DesktopOnlyGate />
            <BackgroundPattern />
            
            {/* Global Left Sidebar (Antigravity Style) */}
            <ActivityBar active={activeActivity} onChange={setActiveActivity} />
            <div className="relative z-20 h-full w-60 flex-shrink-0">
                <Sidebar />
            </div>

            {/* Main Workspace Area */}
            <div className="relative z-10 flex-1 flex flex-col h-screen overflow-hidden pointer-events-auto">
                <Header />
                <div className="flex items-center justify-between px-5 py-3 border-b border-googleAnti-blue/10 bg-googleAnti-ink/60 relative z-20">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-googleAnti-blue/70">Workspace</p>
                        <p className="text-sm font-medium text-gray-300">Untitled project</p>
                    </div>
                    <InstallSwissButton />
                </div>
                {/* VS Code layout: project explorer, editor, then agent panel. */}
                <div className="flex flex-1 overflow-hidden relative">
                    {/* Center: code editor and live preview */}
                    <div className="min-w-0 flex-1 bg-[#0a0a0f] relative overflow-hidden flex flex-col pointer-events-auto transition-none">
                        <div className="flex h-9 shrink-0 items-center border-b border-white/10 bg-[#11141b] text-[11px] text-gray-400">
                            <div className="flex h-full items-center gap-2 border-r border-white/10 bg-[#0a0a0f] px-4 text-gray-200"><Code className="h-3.5 w-3.5 text-[#b9e55b]" /> App.jsx <span className="text-gray-600">×</span></div>
                            <div className="ml-auto flex items-center gap-3 px-3 text-gray-600"><span>Split Editor</span><span>Preview</span></div>
                        </div>
                        {isDragging && <div className="absolute inset-0 z-50" />}
                        <div className="min-h-0 flex-1 overflow-hidden"><CodeView /></div>
                        <BottomPanel />
                    </div>

                    {/* Resizer Handle */}
                    <div 
                        onMouseDown={handleMouseDown}
                        className="w-2 z-50 bg-black hover:bg-googleAnti-blue/20 cursor-col-resize flex-shrink-0 transition-colors h-full flex items-center justify-center group pointer-events-auto"
                    >
                        <div className="h-8 w-[2px] rounded-full bg-googleAnti-blue/40 group-hover:bg-googleAnti-blue transition-colors" />
                    </div>

                    {/* Right Panel: agent conversation */}
                    <div
                        className="shrink-0 bg-googleAnti-ink/80 flex flex-col h-full pointer-events-auto transition-none"
                        style={{ width: `${agentWidth}px` }}
                    >
                        <div className="flex-1 overflow-hidden pointer-events-auto">
                            <ChatView />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Workspace;

