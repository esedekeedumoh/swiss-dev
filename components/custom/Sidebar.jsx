"use client";
import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { History, MessageSquare, ChevronRight, FolderOpen, Code } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

function Sidebar() {
    const workspaces = useQuery(api.workspace.GetAllWorkspaces);
    const params = useParams();
    const router = useRouter();

    return (
        <div className="w-64 h-full border-r border-googleAnti-blue/10 bg-googleAnti-ink/60 flex flex-col pt-4">
            
            <div className="px-5 mb-6 flex items-center space-x-3">
                <div className="bg-googleAnti-cloud/50 p-1.5 rounded border border-googleAnti-blue/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                    <img
                            src="/logo.svg.png.png"
                        alt="Swiss logo"
                        className="h-5 w-5 object-contain"
                        onError={(e) => {
                            e.target.onerror = null; 
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                        }}
                    />
                    <Code className="h-5 w-5 text-googleAnti-blue drop-shadow-md hidden" />
                </div>
                <h1 className="text-md font-bold text-white tracking-wider">Swiss Dev</h1>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-2 space-y-6">
                
                <div>
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2 flex items-center">
                        <FolderOpen className="h-4 w-4 mr-2 text-googleAnti-blue" />
                        Projects
                    </h2>
                    <div className="space-y-1">
                        {!workspaces ? (
                            <div className="px-2 py-3 text-xs text-gray-500 animate-pulse">Loading history...</div>
                        ) : workspaces.length === 0 ? (
                            <div className="px-2 py-3 text-xs text-gray-500">No workspaces yet.</div>
                        ) : (
                            workspaces.map((ws) => (
                                <button 
                                    key={ws._id}
                                    onClick={() => router.push('/workspace/' + ws._id)}
                                    className={`w-full flex items-center px-2 py-2 rounded-lg text-sm transition-all group ${
                                        params.id === ws._id 
                                            ? 'bg-googleAnti-blue/20 text-white' 
                                            : 'text-gray-400 hover:bg-googleAnti-cloud hover:text-white'
                                    }`}
                                >
                                    <MessageSquare className={`h-4 w-4 mr-3 flex-shrink-0 ${params.id === ws._id ? 'text-googleAnti-blue' : 'text-gray-500 group-hover:text-googleAnti-blue/70'}`} />
                                    <span className="truncate text-left flex-1" title={ws._id}>
                                        {/* Typically we would name workspaces, but we'll show ID or parsed message snippet for now */}
                                        {ws.messages && ws.messages.length > 0 && typeof ws.messages[0].content === 'string'
                                            ? ws.messages[0].content.substring(0, 25) + '...'
                                            : 'Unnamed Project'}
                                    </span>
                                    {params.id === ws._id && <ChevronRight className="h-4 w-4 opacity-50" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Sidebar;
