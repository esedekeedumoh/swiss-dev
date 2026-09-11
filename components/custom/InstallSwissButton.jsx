"use client";

import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";

function InstallSwissButton() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setDeferredPrompt(event);
        };

        const handleAppInstalled = () => {
            setInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt
            );
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
            setDeferredPrompt(null);
        }
    };

    if (installed) {
        return (
            <div className="inline-flex items-center rounded-full border border-googleAnti-green/30 bg-googleAnti-green/15 px-3 py-2 text-xs font-semibold text-googleAnti-green">
                Swiss Dev installed
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={handleInstall}
            disabled={!deferredPrompt}
            className="inline-flex items-center gap-2 rounded-full border border-googleAnti-blue/30 bg-googleAnti-blue/15 px-3 py-2 text-xs font-semibold text-googleAnti-blue transition hover:bg-googleAnti-blue/25 disabled:cursor-not-allowed disabled:opacity-60"
            title={
                deferredPrompt
                    ? "Install Swiss on your PC"
                    : "Open in Chrome/Edge and use Install App from the browser menu"
            }
        >
            <Download className="h-4 w-4" />
            Install Swiss Dev
        </button>
    );
}

export default InstallSwissButton;

