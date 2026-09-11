"use client"
import React, { createContext, useEffect, useState } from 'react';

export const ThemeColorContext = createContext();

export const ThemeColorProvider = ({ children }) => {
    // Default to Antigravity blue
    const [themeColor, setThemeColor] = useState('#3B82F6'); 

    useEffect(() => {
        // Dynamically update the blue accent color across the app
        document.documentElement.style.setProperty('--googleAnti-blue', themeColor);
        // We can also compute a darker variant for borders if desired, but letting tailwind opacity handle it is easier.
    }, [themeColor]);

    return (
        <ThemeColorContext.Provider value={{ themeColor, setThemeColor }}>
            {children}
        </ThemeColorContext.Provider>
    );
};
