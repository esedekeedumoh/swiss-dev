"use client"
import { MessagesContext } from '@/context/MessagesContext';
import { ArrowRight, Link, Loader2Icon, Send, Square, Sparkles, LayoutDashboard, Globe, LineChart, ShoppingBag } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { useConvex } from 'convex/react';
import { useParams } from 'next/navigation';
import { useContext, useEffect, useState, useCallback, memo, useRef } from 'react';
import { useMutation } from 'convex/react';
import Prompt from '@/convex/data/Prompt';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import PlanArtifact from './PlanArtifact';
import { ModelContext } from '@/context/ModelContext';

const MessageItem = memo(({ msg, index }) => {
    const isPlan = msg.role === 'ai' && (msg.content.includes('Implementation Plan') || msg.content.includes('## Proposed Changes'));

    return (
        <div
            className={`p-4 rounded-lg transition-all duration-300 ${
                msg.role === 'user' 
                    ? 'bg-googleAnti-cloud/40 border border-googleAnti-blue/10 ml-4' 
                    : 'bg-transparent border border-transparent mr-4'
            }`}
        >
            <div className="flex items-start gap-4">
                <div className={`p-2 rounded-xl flex-shrink-0 flex items-center justify-center h-8 w-8 ${
                    msg.role === 'user' 
                        ? 'bg-googleAnti-blue/20 text-googleAnti-blue' 
                        : 'bg-googleAnti-green/20 text-googleAnti-green'
                }`}>
                    <span className="text-xs font-bold">{msg.role === 'user' ? 'U' : 'AI'}</span>
                </div>
                <div className="flex-1 w-full min-w-0">
                    {isPlan ? (
                        <PlanArtifact content={msg.content} />
                    ) : (
                        <ReactMarkdown className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed break-words whitespace-pre-wrap">
                            {msg.content}
                        </ReactMarkdown>
                    )}
                </div>
            </div>
        </div>
    );
});

MessageItem.displayName = 'MessageItem';

function ChatView() {
    const { id } = useParams();
    const convex = useConvex();
    const { messages, setMessages } = useContext(MessagesContext);
    const { selectedModel } = useContext(ModelContext);
    const [userInput, setUserInput] = useState('');
    const [loading, setLoading] = useState(false);
    const UpdateMessages = useMutation(api.workspace.UpdateWorkspace);
    
    // Physics Refs
    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);
    const textareaRef = useRef(null);
    const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);

    const loadingPhrases = [
        "Analyzing architecture...",
        "Drafting UI components...",
        "Synthesizing codebase...",
        "Booting React execution..."
    ];

    useEffect(() => {
        if (!loading) {
            setLoadingPhraseIndex(0);
            return;
        }
        const interval = setInterval(() => {
            setLoadingPhraseIndex(p => (p + 1) % loadingPhrases.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [loading]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const GetWorkSpaceData = useCallback(async () => {
        const result = await convex.query(api.workspace.GetWorkspace, {
            workspaceId: id
        });
        setMessages(result?.messages || []);
    }, [id, convex, setMessages]);

    useEffect(() => {
        if (id) GetWorkSpaceData();
    }, [id, GetWorkSpaceData]);

    const GetAiResponse = useCallback(async () => {
        setLoading(true);
        const PROMPT = JSON.stringify(messages) + Prompt.CHAT_PROMPT;
        
        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: PROMPT, model: selectedModel }),
                signal: abortControllerRef.current.signal
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            const aiMessageIndex = messages.length;
            setMessages(prev => [...prev, { role: 'ai', content: '' }]);

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
                                fullText += data.chunk;
                                setMessages(prev => {
                                    const updated = [...prev];
                                    updated[aiMessageIndex] = { role: 'ai', content: fullText };
                                    return updated;
                                });
                            }
                            if (data.done && data.result) {
                                fullText = data.result;
                                setMessages(prev => {
                                    const updated = [...prev];
                                    updated[aiMessageIndex] = { role: 'ai', content: fullText };
                                    return updated;
                                });
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }

            const finalMessages = [...messages, { role: 'ai', content: fullText }];
            await UpdateMessages({
                messages: finalMessages,
                workspaceId: id
            });
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Generation stopped by user');
            } else {
                console.error('Error getting AI response:', error);
            }
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
        }
    }, [messages, id, UpdateMessages, setMessages]);

    useEffect(() => {
        if (messages?.length > 0 && !loading) {
            const role = messages[messages.length - 1].role;
            if (role === 'user') {
                GetAiResponse();
            }
        }
    }, [messages, GetAiResponse, loading]);

    const onGenerate = useCallback(() => {
        if (!userInput.trim()) return;
        setMessages(prev => [...prev, {
            role: 'user',
            content: userInput
        }]);
        setUserInput('');
        if (textareaRef.current) {
            textareaRef.current.style.height = '128px'; // reset to original min-height
        }
    }, [userInput, setMessages]);

    const stopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setLoading(false);
    };

    const handleInputChange = (e) => {
        setUserInput(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 300)}px`;
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onGenerate();
        }
    };

    return (
        <div className="relative h-full flex flex-col bg-googleAnti-ink">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 pt-6 flex flex-col">
                {(!messages || messages.length === 0) && !loading && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 mt-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 zoom-in-95">
                        <div className="p-5 rounded-3xl bg-googleAnti-blue/10 border border-googleAnti-blue/20 flex flex-col items-center shadow-[0_0_40px_rgba(59,130,246,0.15)] mb-8">
                            <Sparkles className="w-10 h-10 text-googleAnti-blue" />
                        </div>
                        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-3 tracking-tight">What are we building?</h2>
                        <p className="text-gray-400 max-w-lg mb-10 text-sm">Swiss Dev is ready to turn your next idea into a working React product. Type a brief below or pick a starter.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
                            {[
                                { title: "Modern SaaS Dashboard", icon: <LayoutDashboard className="w-5 h-5 text-purple-400"/>, prompt: "Build a modern SaaS dashboard with a sidebar navigation, stat cards, and a dark glassmorphic theme using Tailwind." },
                                { title: "Crypto Landing Page", icon: <Globe className="w-5 h-5 text-blue-400"/>, prompt: "Create a conversion-focused landing page for a new crypto startup featuring a hero section and responsive features grid." },
                                { title: "Analytics Overview", icon: <LineChart className="w-5 h-5 text-green-400"/>, prompt: "Design an analytics overview panel with mock charts, recent transaction lists, and revenue KPIs." },
                                { title: "E-Commerce Storefront", icon: <ShoppingBag className="w-5 h-5 text-orange-400"/>, prompt: "Build an elegant tech e-commerce storefront with a product grid, shopping cart sidebar, and promotional banner." },
                            ].map(item => (
                                <button 
                                    key={item.title} 
                                    onClick={() => {
                                        setUserInput(item.prompt);
                                    }}
                                    className="flex items-center gap-4 text-left p-4 rounded-2xl bg-googleAnti-cloud/20 border border-white/5 hover:border-googleAnti-blue/30 hover:bg-googleAnti-cloud/40 transition-all group"
                                >
                                    <div className="p-3 bg-gray-900 rounded-xl group-hover:scale-110 transition-transform">
                                        {item.icon}
                                    </div>
                                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{item.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div className="max-w-4xl mx-auto space-y-6 w-full">
                    {Array.isArray(messages) && messages?.map((msg, index) => (
                        <MessageItem key={index} msg={msg} index={index} />
                    ))}
                    
                    {loading && (
                        <div className="p-4 rounded-xl flex items-center justify-between bg-googleAnti-cloud/20 border border-googleAnti-blue/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex items-center gap-3 text-googleAnti-blue">
                                <Loader2Icon className="animate-spin h-5 w-5" />
                                <p className="font-medium text-sm transition-all duration-300">{loadingPhrases[loadingPhraseIndex]}</p>
                            </div>
                            <button
                                onClick={stopGeneration}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-xs font-semibold transition-all"
                            >
                                <Square className="h-3 w-3 fill-current" />
                                Stop
                            </button>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Section */}
            <div className="border-t border-googleAnti-blue/10 bg-googleAnti-ink/60 backdrop-blur-md p-4">
                <div className="max-w-4xl mx-auto relative rounded-2xl bg-[#0a0a0f] border border-googleAnti-blue/20 focus-within:border-googleAnti-blue/50 focus-within:ring-1 focus-within:ring-googleAnti-blue/20 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <textarea
                        ref={textareaRef}
                        placeholder="Build me a custom layout..."
                        value={userInput}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        className="w-full bg-transparent p-4 pr-16 text-gray-200 placeholder-gray-500 outline-none resize-none min-h-[128px] max-h-[300px] text-sm overflow-y-auto rounded-2xl"
                    />
                    
                    <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                        <button className="text-gray-500 hover:text-white p-2 rounded-xl hover:bg-googleAnti-cloud/40 transition-colors">
                            <Link className="h-5 w-5" />
                        </button>
                        <button
                            onClick={onGenerate}
                            disabled={!userInput.trim() || loading}
                            className={`p-2.5 rounded-xl transition-all ${
                                userInput.trim() && !loading
                                    ? 'bg-googleAnti-blue text-white shadow-[0_0_10px_rgba(59,130,246,0.5)] hover:bg-blue-500' 
                                    : 'bg-googleAnti-cloud/50 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            <Send className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                <div className="text-center mt-3">
                    <p className="text-[11px] text-gray-600 font-medium">Swiss Dev can generate errors. Review the result before shipping.</p>
                </div>
            </div>
        </div>
    );
}

export default ChatView;