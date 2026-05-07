"use client"
import React, { useContext, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Lookup from '@/data/Lookup';
import { MessagesContext } from '@/context/MessagesContext';
import Prompt from '@/data/Prompt';
import { useConvex, useMutation } from 'convex/react';
import { useParams } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { Loader2Icon, Download } from 'lucide-react';
import JSZip from 'jszip';

const SandpackProvider = dynamic(() => import("@codesandbox/sandpack-react").then(mod => mod.SandpackProvider), { ssr: false });
const SandpackLayout = dynamic(() => import("@codesandbox/sandpack-react").then(mod => mod.SandpackLayout), { ssr: false });
const SandpackCodeEditor = dynamic(() => import("@codesandbox/sandpack-react").then(mod => mod.SandpackCodeEditor), { ssr: false });
const SandpackPreview = dynamic(() => import("@codesandbox/sandpack-react").then(mod => mod.SandpackPreview), { ssr: false });
const SandpackFileExplorer = dynamic(() => import("@codesandbox/sandpack-react").then(mod => mod.SandpackFileExplorer), { ssr: false });

function CodeView() {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('code');
    const [files, setFiles] = useState(Lookup?.DEFAULT_FILE);
    const { messages } = useContext(MessagesContext);
    const UpdateFiles = useMutation(api.workspace.UpdateFiles);
    const convex = useConvex();
    
    // NEW STATES
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

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
        setCurrentStep(1); // Step 1: Analyzing Requirements
        
        const PROMPT = JSON.stringify(messages) + " " + Prompt.CODE_GEN_PROMPT;
        
        try {
            const response = await fetch('/api/gen-ai-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: PROMPT }),
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let finalData = null;

            // Move to Step 2: Generating Components as soon as stream starts
            setCurrentStep(2); 

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                
                // Vibe Trick: Detect styling phase
                if (chunk.includes('className') || chunk.includes('tailwind') || chunk.includes('style')) {
                    setCurrentStep(3); // Step 3: Styling with Tailwind
                }

                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.done && data.final) {
                                finalData = data.final;
                            }
                        } catch (e) { /* Skip partial JSON */ }
                    }
                }
            }

            if (finalData && finalData.files) {
                setCurrentStep(4); // Step 4: Finalizing Files
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
                let fileContent = typeof content === 'string' ? content : content?.code || JSON.stringify(content, null, 2);
                if (fileContent) {
                    const cleanFileName = filename.startsWith('/') ? filename.slice(1) : filename;
                    zip.file(cleanFileName, fileContent);
                }
            });

            const packageJson = {
                name: "generated-project",
                version: "1.0.0",
                dependencies: Lookup.DEPENDANCY,
                scripts: { "dev": "vite", "build": "vite build", "preview": "vite preview" }
            };
            zip.file("package.json", JSON.stringify(packageJson, null, 2));

            const blob = await zip.generateAsync({ type: "blob" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'project-files.zip';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading files:', error);
        }
    }, [files]);

    return (
        <div className='relative'>
            <div className='bg-[#181818] w-full p-2 border'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center shrink-0 bg-black p-1 w-[140px] gap-3 rounded-full'>
                        <h2 onClick={() => setActiveTab('code')}
                            className={`text-sm cursor-pointer px-2 ${activeTab === 'code' && 'text-blue-500 bg-blue-500/25 rounded-full'}`}>
                            Code</h2>
                        <h2 onClick={() => setActiveTab('preview')}
                            className={`text-sm cursor-pointer px-2 ${activeTab === 'preview' && 'text-blue-500 bg-blue-500/25 rounded-full'}`}>
                            Preview</h2>
                    </div>
                    
                    <button onClick={downloadFiles} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition-all">
                        <Download className="h-4 w-4" />
                        <span className="text-sm">Download</span>
                    </button>
                </div>
            </div>

            <SandpackProvider 
                files={files}
                template="react" 
                theme={'dark'}
                customSetup={{
                    dependencies: { ...Lookup.DEPENDANCY },
                    entry: '/index.js'
                }}
                options={{
                    externalResources: ['https://cdn.tailwindcss.com'],
                    bundlerTimeoutSecs: 120,
                }}
            >
                <SandpackLayout>
                    {activeTab === 'code' ? (
                        <>
                            <SandpackFileExplorer style={{ height: '80vh' }} />
                            <SandpackCodeEditor style={{ height: '80vh' }} showTabs showLineNumbers wrapContent />
                        </>
                    ) : (
                        <SandpackPreview style={{ height: '80vh' }} showNavigator={true} />
                    )}
                </SandpackLayout>
            </SandpackProvider>

            {/* ENHANCED STEP-BY-STEP LOADER */}
            {loading && (
                <div className='p-10 bg-gray-900/90 backdrop-blur-sm absolute inset-0 z-50 rounded-lg flex flex-col items-center justify-center gap-6'>
                    <Loader2Icon className="animate-spin h-12 w-12 text-blue-500"/>
                    <div className='flex flex-col gap-4 w-64'>
                        <h2 className='text-white text-xl font-bold text-center'>Building your Site</h2>
                        {[
                            { id: 1, label: "Analyzing Requirements" },
                            { id: 2, label: "Generating Components" },
                            { id: 3, label: "Styling with Tailwind" },
                            { id: 4, label: "Finalizing Files" }
                        ].map((step) => (
                            <div key={step.id} className={`flex items-center gap-3 transition-all duration-500 ${currentStep >= step.id ? 'opacity-100' : 'opacity-30'}`}>
                                <div className={`h-2 w-2 rounded-full ${currentStep > step.id ? 'bg-green-500' : currentStep === step.id ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'}`} />
                                <p className={`text-sm ${currentStep === step.id ? 'text-blue-400 font-medium' : 'text-gray-400'}`}>
                                    {step.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CodeView;