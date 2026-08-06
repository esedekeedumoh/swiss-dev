"use client";

import dynamic from 'next/dynamic';
import React from 'react';

const ChatView = dynamic(() => import('@/components/custom/ChatView'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-secondary rounded-lg h-full" />
});

const CodeView = dynamic(() => import('@/components/custom/CodeView'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-secondary rounded-lg h-full" />
});

const BackgroundPattern = React.memo(() => (
    <div className="absolute inset-0 grid-bg pointer-events-none">
        <div
            className="absolute left-1/2 top-0 h-[500px] w-[1000px] -translate-x-1/2 pointer-events-none"
            style={{
                background: 'radial-gradient(ellipse 60% 40% at 50% 0%, var(--glow-color), transparent)',
            }}
        />
    </div>
));

BackgroundPattern.displayName = 'BackgroundPattern';

const Workspace = () => {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden theme-transition">
            <BackgroundPattern />
            <div className='relative z-10 p-6'>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm theme-transition">
                        <ChatView />
                    </div>
                    <div className='col-span-3 bg-card border border-border rounded-2xl overflow-hidden shadow-sm theme-transition'>
                        <CodeView />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Workspace;