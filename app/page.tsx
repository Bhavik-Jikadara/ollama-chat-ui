'use client';

import dynamic from 'next/dynamic';
import { RefreshCw } from 'lucide-react';
import { Analytics } from "@vercel/analytics/next";

const LoadingScreen = () => (
    <div className="flex items-center justify-center h-screen bg-[#0d0a1a]">
        <div className="text-center">
            <RefreshCw className="animate-spin mx-auto mb-4 text-violet-500" size={32} aria-hidden="true" />
            <p className="text-slate-400">Loading Ollama UI…</p>
        </div>
    </div>
);

// Disable SSR — the chat UI requires browser APIs (window, navigator.clipboard, etc.)
const OllamaChatUI = dynamic(() => import('@/components/OllamaChatUI'), {
    ssr: false,
    loading: LoadingScreen,
});

export default function Home() {
    return (
        <>
            <OllamaChatUI />
            <Analytics />
        </>
    );
}
