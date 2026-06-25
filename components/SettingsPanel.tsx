'use client';

import { Settings, X, Save, RotateCcw, Wifi, WifiOff, Loader, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { OllamaStatus } from '@/hooks/useOllama';

interface SettingsPanelProps {
    temperature: number;
    onTemperatureChange: (temp: number) => void;
    systemPrompt: string;
    onSystemPromptChange: (prompt: string) => void;
    ollamaUrl: string;
    onOllamaUrlChange: (url: string) => void;
    ollamaStatus: OllamaStatus;
    onClearHistory: () => void;
    onClose: () => void;
}

const DEFAULT_PROMPT = 'You are a helpful AI assistant.';

const STATUS_STYLES: Record<OllamaStatus, string> = {
    connected:   'bg-green-500/15 text-green-400 border-green-500/30',
    checking:    'bg-violet-500/15 text-violet-400 border-violet-500/30',
    unavailable: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const STATUS_LABELS: Record<OllamaStatus, string> = {
    connected:   'Connected',
    checking:    'Checking…',
    unavailable: 'Unavailable',
};

const StatusIcon = ({ status }: { status: OllamaStatus }) => {
    if (status === 'connected')   return <Wifi size={12} />;
    if (status === 'checking')    return <Loader size={12} className="animate-spin" />;
    return <WifiOff size={12} />;
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    temperature,
    onTemperatureChange,
    systemPrompt,
    onSystemPromptChange,
    ollamaUrl,
    onOllamaUrlChange,
    ollamaStatus,
    onClearHistory,
    onClose,
}) => {
    const [localPrompt, setLocalPrompt] = useState(systemPrompt);
    const [localUrl,    setLocalUrl]    = useState(ollamaUrl);
    const [urlError,    setUrlError]    = useState('');
    const isMobile = useIsMobile();

    const handleSavePrompt = () => {
        onSystemPromptChange(localPrompt);
        if (isMobile) setTimeout(onClose, 200);
    };

    const handleReset = () => {
        setLocalPrompt(DEFAULT_PROMPT);
        onTemperatureChange(0.7);
    };

    const handleConnectUrl = () => {
        const trimmed = localUrl.trim().replace(/\/$/, '');
        if (!trimmed) return;
        if (!/^https?:\/\//i.test(trimmed)) {
            setUrlError('URL must start with http:// or https://');
            return;
        }
        setUrlError('');
        onOllamaUrlChange(trimmed);
    };

    const content = (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-5 sm:mb-6">
                <h3 className="text-base font-semibold flex items-center gap-2 text-slate-100">
                    <Settings size={18} aria-hidden="true" />
                    Settings
                </h3>
                <button
                    onClick={onClose}
                    className="p-2.5 hover:bg-white/5 rounded-lg transition-all touch-manipulation text-slate-400 hover:text-slate-200"
                    aria-label="Close settings"
                >
                    <X size={20} />
                </button>
            </div>

            {/* ── Ollama Connection ── */}
            <section className="mb-5 sm:mb-6 pb-5 sm:pb-6 border-b border-white/8">
                <div className="flex items-center gap-2 mb-3">
                    <p className="text-sm font-medium text-slate-200">Ollama Connection</p>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLES[ollamaStatus]}`}>
                        <StatusIcon status={ollamaStatus} />
                        {STATUS_LABELS[ollamaStatus]}
                    </span>
                </div>
                <div className="flex gap-2 mb-1.5">
                    <input
                        type="url"
                        value={localUrl}
                        onChange={e => { setLocalUrl(e.target.value); setUrlError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleConnectUrl()}
                        placeholder="http://localhost:11434"
                        className={`flex-1 px-3 py-2.5 bg-[#1a1535] border rounded-lg text-sm font-mono text-slate-200 focus:outline-none transition-colors ${
                            urlError
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-white/8 focus:border-violet-500/50'
                        }`}
                        aria-label="Ollama server URL"
                        aria-invalid={!!urlError}
                        aria-describedby={urlError ? 'url-error' : undefined}
                    />
                    <button
                        onClick={handleConnectUrl}
                        className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 rounded-lg text-sm font-medium transition-all touch-manipulation shrink-0 text-white"
                    >
                        Connect
                    </button>
                </div>
                {urlError && (
                    <p id="url-error" className="text-xs text-red-400 mb-2">{urlError}</p>
                )}
                <p className="text-xs text-slate-500 leading-relaxed">
                    To allow connections from this site, start Ollama with:{' '}
                    <code className="font-mono text-amber-400 bg-[#1a1535] px-1 rounded">
                        OLLAMA_ORIGINS=* ollama serve
                    </code>
                </p>
            </section>

            {/* ── Model + Prompt ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 mb-5 sm:mb-6 pb-5 sm:pb-6 border-b border-white/8">
                {/* Temperature */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label htmlFor="temperature-slider" className="text-sm text-slate-300">
                            Temperature
                        </label>
                        <span className="text-xs font-medium bg-violet-500/20 text-violet-400 px-2 py-1 rounded tabular-nums">
                            {temperature.toFixed(1)}
                        </span>
                    </div>
                    <input
                        id="temperature-slider"
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={temperature}
                        onChange={e => onTemperatureChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-white/8 rounded-lg appearance-none cursor-pointer accent-violet-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-violet-500 [&::-moz-range-thumb]:border-0 touch-manipulation"
                        aria-valuemin={0}
                        aria-valuemax={2}
                        aria-valuenow={temperature}
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-2" aria-hidden="true">
                        <span>Precise</span>
                        <span>Balanced</span>
                        <span>Creative</span>
                    </div>
                </div>

                {/* System Prompt */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label htmlFor="system-prompt" className="text-sm text-slate-300">
                            System Prompt
                        </label>
                        <button
                            onClick={handleSavePrompt}
                            className="flex items-center gap-1 text-xs bg-violet-600 hover:bg-violet-500 px-3.5 py-2 rounded-lg transition-all touch-manipulation text-white"
                        >
                            <Save size={13} aria-hidden="true" />
                            Save
                        </button>
                    </div>
                    <textarea
                        id="system-prompt"
                        value={localPrompt}
                        onChange={e => setLocalPrompt(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2.5 bg-[#1a1535] border border-white/8 rounded-lg text-sm text-slate-200 resize-none focus:outline-none focus:border-violet-500/50 transition-colors placeholder:text-slate-600"
                        placeholder="Define the AI's behavior and personality…"
                    />
                </div>
            </div>

            {/* ── Footer actions ── */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-slate-300 bg-white/5 hover:bg-white/8 border border-white/8 rounded-lg transition-all touch-manipulation"
                >
                    <RotateCcw size={15} aria-hidden="true" />
                    Reset Defaults
                </button>

                <button
                    onClick={onClearHistory}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all touch-manipulation"
                >
                    <Trash2 size={15} aria-hidden="true" />
                    Clear Chat History
                </button>
            </div>
        </>
    );

    if (isMobile) {
        return (
            <div
                className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
                onClick={onClose}
                role="dialog"
                aria-modal="true"
                aria-label="Settings"
            >
                <div
                    className="w-full max-w-lg bg-[#130f28] border-t border-white/8 rounded-t-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-4 sm:p-5">{content}</div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="bg-[#130f28]/95 backdrop-blur-xl border-b border-white/8 p-4 md:p-6 animate-slide-down"
            role="region"
            aria-label="Settings"
        >
            <div className="max-w-5xl mx-auto">{content}</div>
        </div>
    );
};
