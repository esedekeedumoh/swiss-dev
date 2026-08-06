"use client"
import { MessagesContext } from '@/context/MessagesContext';
import { ArrowRight, Link, Loader2Icon, Send } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { useConvex } from 'convex/react';
import { useParams } from 'next/navigation';
import { useContext, useEffect, useState, useCallback, memo } from 'react';
import { useMutation } from 'convex/react';
import Prompt from '@/data/Prompt';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const MessageItem = memo(({ msg, index }) => (
    <div
        className={`p-4 rounded-xl border theme-transition ${
            msg.role === 'user'
                ? 'bg-secondary border-border'
                : 'bg-card border-border'
        }`}
    >
        <div className="flex items-start gap-3">
            <div className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shrink-0 ${
                msg.role === 'user'
                    ? 'bg-primary/15 text-primary'
                    : 'bg-accent/15 text-accent'
            }`}>
                {msg.role === 'user' ? 'You' : 'AI'}
            </div>
            <ReactMarkdown className="prose dark:prose-invert prose-sm flex-1 overflow-auto max-w-none text-foreground">
                {msg.content}
            </ReactMarkdown>
        </div>
    </div>
));

MessageItem.displayName = 'MessageItem';

function ChatView() {
    const { id } = useParams();
    const convex = useConvex();
    const { messages, setMessages } = useContext(MessagesContext);
    const [userInput, setUserInput] = useState('');
    const [loading, setLoading] = useState(false);
    const UpdateMessages = useMutation(api.workspace.UpdateWorkspace);

    const GetWorkSpaceData = useCallback(async () => {
        const result = await convex.query(api.workspace.GetWorkspace, {
            workspaceId: id
        });
        setMessages(result?.messages);
    }, [id, convex, setMessages]);

    useEffect(() => {
        id && GetWorkSpaceData();
    }, [id, GetWorkSpaceData]);

    const GetAiResponse = useCallback(async () => {
        setLoading(true);
        const PROMPT = JSON.stringify(messages) + Prompt.CHAT_PROMPT;
        
        try {
            const response = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: PROMPT }),
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            // Add placeholder AI message for streaming
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
            console.error('Error getting AI response:', error);
        } finally {
            setLoading(false);
        }
    }, [messages, id, UpdateMessages, setMessages]);

    useEffect(() => {
        if (messages?.length > 0) {
            const role = messages[messages?.length - 1].role;
            if (role === 'user') {
                GetAiResponse();
            }
        }
    }, [messages, GetAiResponse]);

    const onGenerate = useCallback((input) => {
        setMessages(prev => [...prev, {
            role: 'user',
            content: input
        }]);
        setUserInput('');
    }, [setMessages]);

    return (
        <div className="relative h-[85vh] flex flex-col bg-background theme-transition">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                    {Array.isArray(messages) && messages?.map((msg, index) => (
                        <MessageItem key={index} msg={msg} index={index} />
                    ))}
                    
                    {loading && (
                        <div className="p-4 rounded-xl bg-card border border-border">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Loader2Icon className="animate-spin h-5 w-5" />
                                <p className="font-medium text-sm">Generating response...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Section */}
            <div className="border-t border-border bg-background/80 backdrop-blur-sm p-4 theme-transition">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                        <div className="flex gap-3">
                            <textarea
                                id="chat-input"
                                placeholder="Ask a follow-up or describe a change..."
                                value={userInput}
                                onChange={(event) => setUserInput(event.target.value)}
                                className="w-full bg-background border border-border rounded-xl p-4 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-200 resize-none h-24 text-sm"
                            />
                            {userInput && (
                                <button
                                    id="chat-send-btn"
                                    onClick={() => onGenerate(userInput)}
                                    className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl px-4 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                        <div className="flex justify-end mt-3">
                            <Link className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors duration-200 cursor-pointer" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatView;