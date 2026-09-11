"use client";
import React, { useContext, useState } from 'react';
import { ThemeColorContext } from '@/context/ThemeColorContext';
import { X, Settings } from 'lucide-react';

function SettingsDialog({ isOpen, onClose }) {
    const { themeColor, setThemeColor } = useContext(ThemeColorContext);
    const [tempColor, setTempColor] = useState(themeColor);

    if (!isOpen) return null;

    const colors = [
        { name: 'Antigravity Blue', hex: '#3B82F6' },
        { name: 'Neon Green', hex: '#10B981' },
        { name: 'Deep Purple', hex: '#8B5CF6' },
        { name: 'Crimson Red', hex: '#EF4444' },
        { name: 'Sunset Orange', hex: '#F97316' },
    ];

    const handleSave = () => {
        setThemeColor(tempColor);
        onClose();
        // Here we could also save 'tempColor' via Convex API to user profile if authed
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-[400px] bg-googleAnti-ink border-2 border-googleAnti-blue/20 rounded-2xl shadow-2xl p-6 relative">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex items-center space-x-3 mb-6">
                    <Settings className="h-6 w-6 text-googleAnti-blue" />
                    <h2 className="text-xl font-bold text-white">Workspace Settings</h2>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-3">Theme Color</label>
                        <div className="grid grid-cols-5 gap-3">
                            {colors.map((c) => (
                                <button
                                    key={c.hex}
                                    onClick={() => setTempColor(c.hex)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${
                                        tempColor === c.hex ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-googleAnti-ink' : 'hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: c.hex }}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Custom Hex</label>
                        <input 
                            type="text" 
                            value={tempColor}
                            onChange={(e) => setTempColor(e.target.value)}
                            className="w-full bg-[#1A1C25] border border-googleAnti-blue/20 rounded-lg p-2 text-white outline-none focus:border-googleAnti-blue transition-colors font-mono uppercase"
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-googleAnti-blue hover:opacity-90 transition-opacity"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SettingsDialog;
