"use client"
import React, { createContext, useState } from 'react';

export const ModelContext = createContext();

export const AI_MODELS = [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'gemini' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'gemini' },
    { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', provider: 'claude' },
    { id: 'claude-opus-4-20250514', label: 'Claude Opus 4', provider: 'claude' },
    { id: 'gpt-5-mini', label: 'GPT-5 Mini', provider: 'openai' },
];

export const ModelProvider = ({ children }) => {
    const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);

    return (
        <ModelContext.Provider value={{ selectedModel, setSelectedModel, models: AI_MODELS }}>
            {children}
        </ModelContext.Provider>
    );
};
