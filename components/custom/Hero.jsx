"use client"
import Lookup from '@/data/Lookup';
import { MessagesContext } from '@/context/MessagesContext';
import { ArrowRight, Link, Sparkles, Send, Wand2, Loader2 } from 'lucide-react';
import React, { useContext, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';

function Hero() {
    const [userInput, setUserInput] = useState('');
    const [isEnhancing, setIsEnhancing] = useState(false);
    const { messages, setMessages } = useContext(MessagesContext);
    const CreateWorkspace = useMutation(api.workspace.CreateWorkspace);
    const router = useRouter();

    const onGenerate = async (input) => {
        const msg = {
            role: 'user',
            content: input
        }
        setMessages(msg);
        const workspaceID = await CreateWorkspace({
            messages: [msg]
        });
        router.push('/workspace/' + workspaceID);
    }

    const enhancePrompt = async () => {
        if (!userInput) return;
        
        setIsEnhancing(true);
        try {
            const response = await fetch('/api/enhance-prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: userInput }),
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let enhancedText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.chunk) {
                                enhancedText += data.chunk;
                                setUserInput(enhancedText);
                            }
                            if (data.done && data.enhancedPrompt) {
                                setUserInput(data.enhancedPrompt);
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error enhancing prompt:', error);
        } finally {
            setIsEnhancing(false);
        }
    };

    const onSuggestionClick = (suggestion) => {
        setUserInput(suggestion);
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden theme-transition">
            {/* Adaptive background: dot-grid (light) / line-grid (dark) */}
            <div className="absolute inset-0 dot-grid dark:hidden pointer-events-none" />
            <div className="absolute inset-0 grid-bg hidden dark:block pointer-events-none" />
            {/* Warm radial glow */}
            <div className="absolute inset-0 glow-top pointer-events-none" />

            <div className="container mx-auto px-4 py-20 relative z-10">
                <div className="flex flex-col items-center justify-center space-y-12">

                    {/* Hero Header */}
                    <div className="text-center space-y-5 max-w-4xl">
                        <div className="inline-flex items-center justify-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
                                Next-Gen AI Development
                            </span>
                        </div>

                        <h1 className="font-display text-6xl md:text-7xl font-normal text-foreground leading-[1.08] tracking-tight">
                            Code the{' '}
                            <span className="text-gradient italic">Impossible</span>
                        </h1>

                        <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed font-normal">
                            Describe your vision and our AI will craft production-ready websites — beautifully, instantly.
                        </p>
                    </div>

                    {/* Input Section */}
                    <div className="w-full max-w-2xl">
                        <div className="bg-card border border-border rounded-2xl shadow-panel overflow-hidden theme-transition">
                            <div className="p-1.5 bg-gradient-to-r from-primary/8 via-accent/8 to-primary/8">
                                <div className="bg-card rounded-xl p-5">
                                    <div className="flex gap-3">
                                        <textarea
                                            id="hero-prompt-input"
                                            placeholder="Describe your website…"
                                            value={userInput}
                                            onChange={(e) => setUserInput(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl p-4 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none font-normal text-sm h-32 resize-none transition-all duration-200 leading-relaxed"
                                            disabled={isEnhancing}
                                        />
                                        <div className="flex flex-col gap-2">
                                            {userInput && (
                                                <>
                                                    <button
                                                        id="enhance-prompt-btn"
                                                        onClick={enhancePrompt}
                                                        disabled={isEnhancing}
                                                        title="Enhance with AI"
                                                        className={`flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl px-4 py-4 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 ${isEnhancing ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                    >
                                                        {isEnhancing ? (
                                                            <Loader2 className="h-6 w-6 animate-spin" />
                                                        ) : (
                                                            <Wand2 className="h-6 w-6" />
                                                        )}
                                                    </button>
                                                    <button
                                                        id="generate-btn"
                                                        onClick={() => onGenerate(userInput)}
                                                        disabled={isEnhancing}
                                                        title="Generate website"
                                                        className={`flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl px-4 py-4 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 ${isEnhancing ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                    >
                                                        <Send className="h-6 w-6" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-3">
                                        <Link className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors duration-200 cursor-pointer" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Suggestions Grid */}
                    <div className="w-full max-w-4xl">
                        <p className="text-center text-[10px] text-muted-foreground mb-5 font-semibold uppercase tracking-[0.2em]">
                            Start with a template
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {Lookup?.SUGGSTIONS.map((suggestion, index) => (
                                <button
                                    key={index}
                                    id={`suggestion-${index}`}
                                    onClick={() => onSuggestionClick(suggestion)}
                                    className="group relative p-4 bg-card hover:bg-secondary border border-border hover:border-primary/30 rounded-xl text-left transition-all duration-200 hover:shadow-card theme-transition text-start"
                                >
                                    <span className="text-muted-foreground group-hover:text-foreground font-normal text-sm leading-snug transition-colors duration-200 line-clamp-2">
                                        {suggestion}
                                    </span>
                                    <ArrowRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-0.5 transition-all duration-200 mt-2" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Hero;