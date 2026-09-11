import React, { useContext, useState, useEffect, useCallback, memo, useRef } from 'react';
import dynamic from 'next/dynamic';
import Lookup from '@/convex/data/Lookup';
import { MessagesContext } from '@/context/MessagesContext';
import axios from 'axios';
import Prompt from '@/convex/data/Prompt';
import { useConvex, useMutation } from 'convex/react';
import { useParams } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { Loader2Icon, Download, Eye, ExternalLink, MessageSquarePlus, TerminalSquare } from 'lucide-react';
import JSZip from 'jszip';
import { ModelContext } from '@/context/ModelContext';

const SandpackProvider = dynamic(() => import("@codesandbox/sandpack-react").then(mod => mod.SandpackProvider), { ssr: false });
const SandpackLayout = dynamic(() => import("@codesandbox/sandpack-react").then(mod => mod.SandpackLayout), { ssr: false });
const SandpackCodeEditor = dynamic(() => import("@codesandbox/sandpack-react").then(mod => mod.SandpackCodeEditor), { ssr: false });
const SandpackPreview = dynamic(() => import("@codesandbox/sandpack-react").then(mod => mod.SandpackPreview), { ssr: false });
const SandpackFileExplorer = dynamic(() => import("@codesandbox/sandpack-react").then(mod => mod.SandpackFileExplorer), { ssr: false });
const SandpackConsole = dynamic(() => import("@codesandbox/sandpack-react").then(mod => mod.SandpackConsole), { ssr: false });

function CodeView() {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('code');
    const [isReviewMode, setIsReviewMode] = useState(false);
    const [isConsoleOpen, setIsConsoleOpen] = useState(false);
    const [files, setFiles] = useState(Lookup?.DEFAULT_FILE);
    const { messages } = useContext(MessagesContext);
    const { selectedModel } = useContext(ModelContext);
    const UpdateFiles = useMutation(api.workspace.UpdateFiles);
    const saveVisualComment = useMutation(api.workspace.SaveVisualComment);
    const convex = useConvex();
    const [loading, setLoading] = useState(false);
    const [visualComments, setVisualComments] = useState([]);
    const overlayRef = useRef(null);
    const [activeCommentBox, setActiveCommentBox] = useState(null);

    const openInChrome = useCallback(() => {
        const iframe = document.querySelector('iframe.sp-preview-iframe');
        if (iframe && iframe.src) {
            window.open(iframe.src, '_blank');
        } else {
            alert("Preview is not fully loaded yet or iframe could not be found.");
        }
    }, []);

    const preprocessFiles = useCallback((files) => {
        const processed = {};
        Object.entries(files).forEach(([path, content]) => {
            if (typeof content === 'string') {
                processed[path] = { code: content };
            } else if (content && typeof content === 'object') {
                if (!content.code && typeof content === 'object') {
                    processed[path] = { code: JSON.stringify(content, null, 2) };
                } else {
                    processed[path] = content;
                }
            }
        });
        return processed;
    }, []);

    const GetFiles = useCallback(async () => {
        const result = await convex.query(api.workspace.GetWorkspace, {
            workspaceId: id
        });
        const processedFiles = preprocessFiles(result?.fileData || {});
        const mergedFiles = { ...Lookup.DEFAULT_FILE, ...processedFiles };
        setFiles(mergedFiles);
    }, [id, convex, preprocessFiles]);

    useEffect(() => {
        id && GetFiles();
    }, [id, GetFiles]);

    const GenerateAiCode = useCallback(async () => {
        setLoading(true);
        const PROMPT = JSON.stringify(messages) + " " + Prompt.CODE_GEN_PROMPT;
        
        try {
            const response = await fetch('/api/gen-ai-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: PROMPT, model: selectedModel }),
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let finalData = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.done && data.final) {
                                finalData = data.final;
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }

            if (finalData && finalData.files) {
                const processedAiFiles = preprocessFiles(finalData.files || {});
                const mergedFiles = { ...Lookup.DEFAULT_FILE, ...processedAiFiles };
                setFiles(mergedFiles);

                await UpdateFiles({
                    workspaceId: id,
                    files: finalData.files
                });
            }
        } catch (error) {
            console.error('Error generating AI code:', error);
        } finally {
            setLoading(false);
        }
    }, [messages, id, UpdateFiles, preprocessFiles]);

    useEffect(() => {
        if (messages?.length > 0) {
            const role = messages[messages?.length - 1].role;
            if (role === 'user') {
                GenerateAiCode();
            }
        }
    }, [messages, GenerateAiCode]);
    
    const downloadFiles = useCallback(async () => {
        try {
            const zip = new JSZip();
            Object.entries(files).forEach(([filename, content]) => {
                let fileContent;
                if (typeof content === 'string') {
                    fileContent = content;
                } else if (content && typeof content === 'object') {
                    if (content.code) {
                        fileContent = content.code;
                    } else {
                        fileContent = JSON.stringify(content, null, 2);
                    }
                }

                if (fileContent) {
                    const cleanFileName = filename.startsWith('/') ? filename.slice(1) : filename;
                    zip.file(cleanFileName, fileContent);
                }
            });

            const packageJson = {
                name: "generated-project",
                version: "1.0.0",
                private: true,
                dependencies: Lookup.DEPENDANCY,
                scripts: {
                    "dev": "vite",
                    "build": "vite build",
                    "preview": "vite preview"
                }
            };
            zip.file("package.json", JSON.stringify(packageJson, null, 2));

            const blob = await zip.generateAsync({ type: "blob" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'project-files.zip';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading files:', error);
        }
    }, [files]);

    const handleOverlayClick = (e) => {
        if (!overlayRef.current) return;
        const rect = overlayRef.current.getBoundingClientRect();
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
        setActiveCommentBox({ xPercent, yPercent, text: '' });
    };

    const submitVisualComment = async () => {
        if (!activeCommentBox?.text.trim()) return;
        
        await saveVisualComment({
            workspaceId: id,
            selectorPath: "visual-pin",
            xPercent: activeCommentBox.xPercent,
            yPercent: activeCommentBox.yPercent,
            comment: activeCommentBox.text,
            author: "User"
        });
        
        setVisualComments([...visualComments, { 
            id: Date.now(), 
            ...activeCommentBox 
        }]);
        setActiveCommentBox(null);
    };

    return (
        <div className="relative flex flex-col h-full bg-[#1A1C24] overflow-hidden">
            <div className="bg-googleAnti-ink/80 backdrop-blur-md px-4 py-3 border-b border-googleAnti-blue/10 flex items-center justify-between shrink-0 shadow-md">
                <div className="flex items-center space-x-2 bg-googleAnti-cloud/40 p-1 rounded-xl border border-googleAnti-blue/10">
                    <button 
                        onClick={() => setActiveTab('code')}
                        className={`text-sm tracking-wide font-medium px-4 py-1.5 rounded-lg transition-all ${
                            activeTab === 'code' 
                                ? 'text-white bg-googleAnti-blue shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                                : 'text-gray-400 hover:text-white'
                        }`}>
                        Code
                    </button>
                    <button 
                        onClick={() => setActiveTab('preview')}
                        className={`text-sm tracking-wide font-medium px-4 py-1.5 rounded-lg transition-all ${
                            activeTab === 'preview' 
                                ? 'text-white bg-googleAnti-blue shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                                : 'text-gray-400 hover:text-white'
                        }`}>
                        Preview
                    </button>
                </div>
                
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                            isConsoleOpen 
                                ? 'bg-googleAnti-blue/20 text-white border border-googleAnti-blue/30' 
                                : 'bg-transparent text-gray-400 hover:text-white hover:bg-googleAnti-cloud/40'
                        }`}
                        title="Toggle Terminal"
                    >
                        <TerminalSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">Terminal</span>
                    </button>

                    {activeTab === 'preview' && (
                        <>
                            <button
                                onClick={openInChrome}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all bg-googleAnti-cloud/40 text-gray-300 border border-googleAnti-blue/10 hover:bg-googleAnti-cloud"
                            >
                                <ExternalLink className="h-4 w-4" />
                                <span className="hidden sm:inline">Pop Out</span>
                            </button>
                            <button
                                onClick={() => setIsReviewMode(!isReviewMode)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                    isReviewMode 
                                        ? 'bg-googleAnti-green/20 text-googleAnti-green border border-googleAnti-green/30' 
                                        : 'bg-googleAnti-cloud/40 text-gray-300 border border-googleAnti-blue/10 hover:bg-googleAnti-cloud'
                                }`}
                            >
                                <Eye className="h-4 w-4" />
                                <span className="hidden sm:inline">{isReviewMode ? 'Exit' : 'Review'}</span>
                            </button>
                        </>
                    )}
                    <button
                        onClick={downloadFiles}
                        className="flex items-center gap-2 bg-googleAnti-blue hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                    >
                        <Download className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden flex flex-col">
                <SandpackProvider 
                files={files}
                template="react" 
                theme={'dark'}
                customSetup={{
                    dependencies: {
                        ...Lookup.DEPENDANCY
                    },
                    entry: '/index.js'
                }}
                options={{
                    externalResources: ['https://cdn.tailwindcss.com'],
                    bundlerTimeoutSecs: 120,
                    recompileMode: "immediate",
                    recompileDelay: 300
                }}
                >
                    <SandpackLayout className="!h-full !flex-col !rounded-none !border-none !bg-transparent">
                        <div className="flex-1 flex w-full relative overflow-hidden">
                            {activeTab === 'code' ? (
                                <>
                                    <SandpackFileExplorer className="!h-full !border-r !border-googleAnti-blue/10" />
                                    <SandpackCodeEditor 
                                    className="!h-full"
                                    showTabs
                                    showLineNumbers
                                    showInlineErrors
                                    wrapContent />
                                </>
                            ) : (
                                <div className="relative w-full h-full">
                                    <SandpackPreview 
                                        className="!h-full w-full"
                                        showNavigator={true}
                                        showOpenInCodeSandbox={false}
                                        showRefreshButton={true}
                                    />
                                    <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-md border border-gray-200/20 bg-gray-950/80 px-2.5 py-1.5 text-[10px] font-semibold tracking-wide text-gray-300 shadow-lg">
                                        Made on Swiss
                                    </div>
                                    {isReviewMode && (
                                        <div 
                                            ref={overlayRef}
                                            onClick={handleOverlayClick}
                                            className="absolute inset-0 z-20 cursor-crosshair bg-googleAnti-blue/5"
                                            title="Click anywhere to leave a comment"
                                        >
                                            {visualComments.map((vc, i) => (
                                                <div 
                                                    key={vc.id || i}
                                                    className="absolute w-6 h-6 -ml-3 -mt-3 bg-googleAnti-green rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.8)] border border-white text-xs font-bold text-white z-30"
                                                    style={{ left: `${vc.xPercent}%`, top: `${vc.yPercent}%` }}
                                                >
                                                    {i + 1}
                                                </div>
                                            ))}
                                            {activeCommentBox && (
                                                <div 
                                                    className="absolute bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-2xl w-64 z-40 cursor-default"
                                                    style={{ left: `${activeCommentBox.xPercent}%`, top: `${activeCommentBox.yPercent}%` }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="w-4 h-4 bg-gray-900 border-l border-t border-gray-700 absolute -top-2 left-4 transform rotate-45" />
                                                    <div className="relative">
                                                        <textarea 
                                                            autoFocus
                                                            className="w-full bg-gray-800 text-sm text-white rounded p-2 focus:outline-none focus:ring-1 focus:ring-googleAnti-blue resize-none h-20"
                                                            placeholder="Leave a visual comment..."
                                                            value={activeCommentBox.text}
                                                            onChange={(e) => setActiveCommentBox({ ...activeCommentBox, text: e.target.value })}
                                                        />
                                                        <div className="flex justify-end space-x-2 mt-2">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setActiveCommentBox(null); }} 
                                                                className="text-xs text-gray-400 hover:text-white px-2"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button 
                                                                onClick={submitVisualComment} 
                                                                className="text-xs bg-googleAnti-blue px-3 py-1.5 rounded text-white font-medium shadow-[0_0_10px_rgba(59,130,246,0.4)]"
                                                            >
                                                                Save
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Antigravity Terminal Panel */}
                        {isConsoleOpen && (
                            <div className="w-full h-48 border-t border-googleAnti-blue/20 bg-[#151515] shrink-0 relative flex flex-col">
                                <div className="bg-[#1e1e1e] border-b border-gray-800 px-3 py-1.5 flex items-center justify-between">
                                    <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Terminal</span>
                                    <button onClick={() => setIsConsoleOpen(false)} className="text-gray-500 hover:text-white text-xs px-2 cursor-pointer">&times;</button>
                                </div>
                                <div className="flex-1 overflow-hidden relative root-console">
                                    <SandpackConsole 
                                        resetOnPreviewRestart={true}
                                        standalone={true}
                                    />
                                </div>
                            </div>
                        )}
                        <style dangerouslySetInnerHTML={{__html: `
                            .root-console .sp-console { height: 100% !important; max-height: none !important; background: transparent !important; }
                            .root-console .sp-console-list { border-radius: 0 !important; }
                        `}} />
                    </SandpackLayout>
                </SandpackProvider>
            </div>

            {loading && (
                <div className='absolute inset-0 z-50 bg-googleAnti-ink/80 backdrop-blur-sm flex flex-col items-center justify-center'>
                    <Loader2Icon className='animate-spin h-10 w-10 text-googleAnti-blue mb-4'/>
                    <h2 className='text-white font-medium tracking-wide'>Generating Code Overrides...</h2>
                </div>
            )}
        </div>
    );
}

export default CodeView;