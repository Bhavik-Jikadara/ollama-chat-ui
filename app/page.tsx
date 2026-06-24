'use client';

import dynamic from 'next/dynamic';
import { RefreshCw } from 'lucide-react';

const LoadingScreen = () => (
    <div className="flex items-center justify-center h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
            <RefreshCw className="animate-spin mx-auto mb-4 text-blue-500" size={32} aria-hidden="true" />
            <p className="text-gray-300">Loading Ollama UI…</p>
        </div>
    </div>
);

// Disable SSR — the chat UI requires browser APIs (window, navigator.clipboard, etc.)
const OllamaChatUI = dynamic(() => import('@/components/OllamaChatUI'), {
    ssr: false,
    loading: LoadingScreen,
});

export default function Home() {
    return <OllamaChatUI />;
}
