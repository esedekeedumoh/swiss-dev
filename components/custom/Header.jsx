"use client";
import React, { useEffect, useState } from 'react';
import { Code, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

function Header() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => setMounted(true), []);

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    return (
        <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50 theme-transition shadow-card">
            <div className="container mx-auto px-6">
                <div className="flex items-center justify-between h-14">
                    {/* Logo */}
                    <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-lg shadow-card">
                            <Code className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex flex-col leading-tight">
                            <h1 className="text-sm font-semibold text-foreground tracking-tight">
                                AI Website Builder
                            </h1>
                            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-[0.18em]">
                                Powered by Gemini
                            </span>
                        </div>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-2.5">
                        {/* AI Ready badge */}
                        <div className="hidden sm:flex items-center space-x-1.5 bg-primary/8 text-primary border border-primary/15 px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-widest uppercase">
                            <Sparkles className="h-3 w-3" />
                            <span>AI Ready</span>
                        </div>

                        {/* Theme toggle */}
                        {mounted && (
                            <button
                                id="theme-toggle-btn"
                                onClick={toggleTheme}
                                aria-label="Toggle theme"
                                className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-secondary hover:bg-muted border border-border text-foreground transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <span
                                    className="absolute transition-all duration-300"
                                    style={{
                                        opacity: resolvedTheme === 'dark' ? 1 : 0,
                                        transform: resolvedTheme === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
                                    }}
                                >
                                    <Moon className="h-4 w-4" />
                                </span>
                                <span
                                    className="absolute transition-all duration-300"
                                    style={{
                                        opacity: resolvedTheme === 'light' ? 1 : 0,
                                        transform: resolvedTheme === 'light' ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0)',
                                    }}
                                >
                                    <Sun className="h-4 w-4" />
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;