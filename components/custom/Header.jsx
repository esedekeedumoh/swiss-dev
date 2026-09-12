import React, { useState, useContext, useRef, useEffect } from 'react';
import { Code, Sparkles, Plus, ChevronDown, LogOut, Settings, User, LockKeyhole } from 'lucide-react';
import SettingsDialog from './SettingsDialog';
import { AI_MODELS, ModelContext } from '@/context/ModelContext';
import { SessionContext } from '@/app/provider';
import supabase from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { MessagesContext } from '@/context/MessagesContext';

function Header() {
    const [logoError, setLogoError] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    
    // Model Selector Logic
    const { selectedModel, setSelectedModel } = useContext(ModelContext);
    const [modelOpen, setModelOpen] = useState(false);
    const selectedModelDetails = AI_MODELS.find((model) => model.id === selectedModel) || AI_MODELS[0];
    
    // Auth Logic
    const { session } = useContext(SessionContext);
    const [profileOpen, setProfileOpen] = useState(false);

    // Navigation and Chat Logic
    const router = useRouter();
    const { setMessages } = useContext(MessagesContext);

    const handleNewChat = () => {
        setMessages([]);
        router.push('/');
    };

    return (
        <>
            <header className="border-b border-googleAnti-blue/10 bg-googleAnti-ink/40 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-14">
                        
                        {/* LEFT: Branding & New Chat */}
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
                                <div className="bg-googleAnti-cloud/50 p-1.5 rounded border border-googleAnti-blue/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                                    {!logoError ? (
                                        <img
                                            src="/logo.svg.png.png"
                                            alt="Swiss logo"
                                            className="h-6 w-6 object-contain"
                                            onError={() => setLogoError(true)}
                                       />
                                    ) : (
                                       <Code className="h-5 w-5 text-googleAnti-blue drop-shadow-md" />
                                    )}
                               </div>
                                <h1 className="text-lg font-bold text-white tracking-wide">Swiss Dev</h1>
                            </div>

                            <button 
                                onClick={handleNewChat}
                                className="hidden md:flex items-center justify-center space-x-1.5 bg-googleAnti-blue/10 hover:bg-googleAnti-blue/20 text-googleAnti-blue border border-googleAnti-blue/20 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                            >
                                <Plus className="h-4 w-4" />
                                <span>New project</span>
                            </button>
                        </div>

                        {/* CENTER: Model Selector */}
                        <div className="relative isolate hidden sm:block">
                            <button 
                                onClick={() => setModelOpen(!modelOpen)}
                                className="flex items-center space-x-2 bg-[#1A1C25] hover:bg-[#20232E] border border-gray-800 px-4 py-1.5 rounded-xl transition-all"
                            >
                                <Sparkles className="h-4 w-4 text-googleAnti-blue" />
                                <span className="text-sm text-gray-300 font-medium">{selectedModelDetails.label}</span>
                                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${modelOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {modelOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setModelOpen(false)}></div>
                                    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-56 bg-[#1A1C25] border border-gray-800 rounded-xl shadow-2xl py-2 z-20">
                                        <div className="px-3 pb-2 mb-2 border-b border-gray-800">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Model</p>
                                        </div>
                                        {AI_MODELS.map((model) => (
                                            <button 
                                                key={model.id}
                                                disabled={!model.free}
                                                onClick={() => { if (model.free) { setSelectedModel(model.id); setModelOpen(false); } }}
                                                title={model.free ? 'Available on Free' : 'Upgrade your plan to unlock this model'}
                                                className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors ${selectedModel === model.id ? 'bg-googleAnti-blue/10 text-googleAnti-blue font-medium' : model.free ? 'text-gray-300 hover:bg-googleAnti-cloud' : 'cursor-not-allowed text-gray-600'}`}
                                            >
                                                <span>{model.label}</span>
                                                {!model.free && <LockKeyhole className="h-3.5 w-3.5" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* RIGHT: Profile & Settings */}
                        <div className="flex items-center space-x-4 relative">
                            {session ? (
                                <div className="relative">
                                    <button 
                                        onClick={() => setProfileOpen(!profileOpen)}
                                        className="h-8 w-8 rounded-full border border-googleAnti-blue/20 cursor-pointer overflow-hidden ring-2 ring-transparent hover:ring-googleAnti-blue/50 transition-all"
                                    >
                                        {session.user?.image ? (
                                            <img src={session.user.image} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full bg-googleAnti-cloud flex items-center justify-center">
                                                <User className="h-4 w-4 text-googleAnti-blue" />
                                            </div>
                                        )}
                                    </button>

                                    {profileOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)}></div>
                                            <div className="absolute top-12 right-0 w-64 bg-[#1A1C25] border border-gray-800 rounded-xl shadow-2xl py-2 z-20">
                                                <div className="px-4 py-3 border-b border-gray-800">
                                                    <p className="text-sm font-medium text-white truncate">{session.user?.name || 'User'}</p>
                                                    <p className="text-xs text-gray-400 truncate">{session.user?.email || ''}</p>
                                                </div>
                                                <div className="py-1">
                                                    <button 
                                                        onClick={() => { setSettingsOpen(true); setProfileOpen(false); }}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-googleAnti-cloud flex items-center"
                                                    >
                                                        <Settings className="h-4 w-4 mr-3 text-gray-400" />
                                                        Theme Settings
                                                    </button>
                                                    <button 
                                                        onClick={() => supabase.auth.signOut()}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center"
                                                    >
                                                        <LogOut className="h-4 w-4 mr-3" />
                                                        Sign Out
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <button 
                                    onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })}
                                    className="bg-googleAnti-cloud hover:bg-gray-700 border border-gray-600 text-sm font-medium text-white px-4 py-1.5 rounded-lg transition-colors"
                                >
                                    Sign In
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <SettingsDialog isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </>
    );
}

export default Header;
