"use client";

import React from 'react';
import { ConvexProvider, ConvexReactClient } from "convex/react";

const ConvexClientProvider = ({ children }) => {
    // Handle missing Convex URL gracefully during development
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
        console.warn("NEXT_PUBLIC_CONVEX_URL not configured. Run 'convex dev' to set up Convex locally.");
        return <>{children}</>;
    }
    
    const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);
    return (
        <ConvexProvider client={convex}>
            {children}
        </ConvexProvider>
    );
};

export default ConvexClientProvider;