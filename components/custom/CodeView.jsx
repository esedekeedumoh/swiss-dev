"use client"
import React, { useContext, useState, useEffect, useCallback, memo } from 'react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import Lookup from '@/data/Lookup';
import { MessagesContext } from '@/context/MessagesContext';
import axios from 'axios';
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
    const [loading, setLoading] = useState(false);
    const { resolvedTheme } = useTheme();
    const sandpackTheme = resolvedTheme === 'light' ? 'light' : 'dark';

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
                body: JSON.stringify({ prompt: PROMPT }),
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
            // Create a new JSZip instance
            const zip = new JSZip();
            
            // Add each file to the zip
            Object.entries(files).forEach(([filename, content]) => {
                // Handle the file content based on its structure
                let fileContent;
                if (typeof content === 'string') {
                    fileContent = content;
                } else if (content && typeof content === 'object') {
                    if (content.code) {
                        fileContent = content.code;
                    } else {
                        // If it's an object without code property, stringify it
                        fileContent = JSON.stringify(content, null, 2);
                    }
                }

                // Only add the file if we have content
                if (fileContent) {
                    // Remove leading slash if present
                    const cleanFileName = filename.startsWith('/') ? filename.slice(1) : filename;
                    zip.file(cleanFileName, fileContent);
                }
            });

            // Add package.json with dependencies
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

            // Generate the zip file
            const blob = await zip.generateAsync({ type: "blob" });
            
            // Create download link and trigger download
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

    return (
        <div className='relative'>
            <div className='bg-card w-full p-3 border-b border-border theme-transition'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center bg-secondary p-1 rounded-full gap-1'>
                        <button
                            id="tab-code"
                            onClick={() => setActiveTab('code')}
                            className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all duration-200 ${
                                activeTab === 'code'
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}>
                            Code
                        </button>
                        <button
                            id="tab-preview"
                            onClick={() => setActiveTab('preview')}
                            className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all duration-200 ${
                                activeTab === 'preview'
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}>
                            Preview
                        </button>
                    </div>

                    {/* Download Button */}
                    <button
                        id="download-files-btn"
                        onClick={downloadFiles}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
                    >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                    </button>
                </div>
            </div>
            <SandpackProvider 
            files={files}
            template="react" 
            theme={sandpackTheme}
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
                <div className="relative">
                    <SandpackLayout>
                        {activeTab=='code'?<>
                            <SandpackFileExplorer style={{ height: '80vh' }} />
                            <SandpackCodeEditor 
                            style={{ height: '80vh' }}
                            showTabs
                            showLineNumbers
                            showInlineErrors
                            wrapContent />
                        </>:
                        <>
                            <SandpackPreview 
                                style={{ height: '80vh' }} 
                                showNavigator={true}
                                showOpenInCodeSandbox={false}
                                showRefreshButton={true}
                            />
                        </>}
                    </SandpackLayout>
                </div>
            </SandpackProvider>

            {loading && <div className='p-10 bg-background/90 dark:bg-gray-900/90 backdrop-blur-sm absolute top-0 
            rounded-lg w-full h-full flex flex-col items-center justify-center gap-3'>
                <Loader2Icon className='animate-spin h-10 w-10 text-primary'/>
                <h2 className='text-foreground font-medium'> Generating files...</h2>
            </div>}
        </div>
    );
}

export default CodeView;