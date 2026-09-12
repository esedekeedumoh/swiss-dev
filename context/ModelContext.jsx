"use client"
import React, { createContext, useState } from 'react';

export const ModelContext = createContext();

export const AI_MODELS = [
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai', free: true },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'gemini', free: false },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'gemini', free: false },
    { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', provider: 'claude', free: false },
    { id: 'claude-opus-4-20250514', label: 'Claude Opus 4', provider: 'claude', free: false },
];

export const ModelProvider = ({ children }) => {
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');

    return (
        <ModelContext.Provider value={{ selectedModel, setSelectedModel, models: AI_MODELS }}>
            {children}
        </ModelContext.Provider>
    );
};
