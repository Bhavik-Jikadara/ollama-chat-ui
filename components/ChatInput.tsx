'use client';

import { ArrowUp, Square, Smile, Zap, X, WifiOff, Paperclip } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useClickOutside } from '@/hooks/useClickOutside';

interface ChatInputProps {
    input: string;
    onInputChange: (value: string) => void;
    onSend: () => void;
    onStop: () => void;
    isStreaming: boolean;
    selectedModel: string;
    disabled: boolean;
    isOllamaOffline?: boolean;
}

const QUICK_PROMPTS = [
    { icon: '💡', label: 'Explain quantum computing' },
    { icon: '🐍', label: 'Write a Python function' },
    { icon: '✈️', label: 'Help plan a vacation' },
    { icon: '📋', label: 'Business plan template' },
    { icon: '📄', label: 'Summarize a document' },
    { icon: '🐛', label: 'Debug this code' },
];

export const ChatInput: React.FC<ChatInputProps> = ({
    input,
    onInputChange,
    onSend,
    onStop,
    isStreaming,
    selectedModel,
    disabled,
    isOllamaOffline = false,
}) => {
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const isMobile = useIsMobile();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const quickActionsRef = useRef<HTMLDivElement>(null);

    useClickOutside(quickActionsRef, useCallback(() => setShowQuickActions(false), []));

    const adjustHeight = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, isMobile ? 120 : 200)}px`;
    }, [isMobile]);

    useEffect(() => { adjustHeight(); }, [adjustHeight, input]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isStreaming && input.trim() && !disabled) onSend();
        }
    };

    const canSend = !disabled && !isStreaming && input.trim().length > 0;
    const charCount = input.length;
    const nearLimit = charCount > 3600;

    return (
        <div className="shrink-0 bg-[#0d0a1a] border-t border-white/6">
            {/* Offline banner */}
            {isOllamaOffline && (
                <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-950/40 border-b border-amber-800/30 text-amber-400/90 text-xs font-medium">
                    <WifiOff size={11} aria-hidden="true" />
                    Ollama is not running —
                    <code className="font-mono bg-amber-900/30 px-1.5 py-0.5 rounded text-amber-300">ollama serve</code>
                </div>
            )}

            <div className="px-3 sm:px-4 pt-3 pb-3 sm:pb-4">
                <div className="max-w-2xl mx-auto space-y-2">

                    {/* Quick Prompts panel */}
                    {showQuickActions && (
                        isMobile ? (
                            /* Mobile: full-screen bottom sheet */
                            <div className="fixed inset-0 z-50 flex items-end bg-black/60">
                                <div
                                    ref={quickActionsRef}
                                    className="w-full bg-[#130f28] border-t border-white/8 rounded-t-2xl shadow-2xl max-h-[70dvh] flex flex-col animate-slide-up"
                                >
                                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/6 shrink-0">
                                        <span className="text-sm font-semibold text-white">Quick Prompts</span>
                                        <button
                                            onClick={() => setShowQuickActions(false)}
                                            className="p-1.5 hover:bg-white/6 rounded-lg touch-manipulation"
                                            aria-label="Close"
                                        >
                                            <X size={16} className="text-slate-400" />
                                        </button>
                                    </div>
                                    <div className="overflow-y-auto p-3 grid grid-cols-1 gap-1.5">
                                        {QUICK_PROMPTS.map(p => (
                                            <button
                                                key={p.label}
                                                onClick={() => { onInputChange(p.label); setShowQuickActions(false); }}
                                                className="flex items-center gap-3 w-full px-4 py-3 text-left bg-white/3 hover:bg-violet-600/10 border border-white/6 hover:border-violet-500/25 rounded-xl transition-colors touch-manipulation"
                                            >
                                                <span className="text-lg shrink-0" aria-hidden="true">{p.icon}</span>
                                                <span className="text-sm text-slate-300">{p.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Desktop: floating panel above input */
                            <div
                                ref={quickActionsRef}
                                className="bg-[#130f28] border border-white/8 rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
                            >
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Prompts</span>
                                    <button
                                        onClick={() => setShowQuickActions(false)}
                                        className="p-1 hover:bg-white/6 rounded-lg"
                                        aria-label="Close"
                                    >
                                        <X size={14} className="text-slate-500" />
                                    </button>
                                </div>
                                <div className="p-3 grid grid-cols-2 gap-1.5">
                                    {QUICK_PROMPTS.map(p => (
                                        <button
                                            key={p.label}
                                            onClick={() => { onInputChange(p.label); setShowQuickActions(false); textareaRef.current?.focus(); }}
                                            className="flex items-center gap-2.5 px-3 py-2.5 text-left bg-white/3 hover:bg-violet-600/8 border border-white/6 hover:border-violet-500/25 rounded-xl transition-colors"
                                        >
                                            <span className="text-base shrink-0" aria-hidden="true">{p.icon}</span>
                                            <span className="text-xs text-slate-400 hover:text-slate-200 truncate">{p.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )
                    )}

                    {/* Input card */}
                    <div className={[
                        'flex flex-col rounded-2xl border bg-[#1a1535] transition-all duration-150',
                        isFocused
                            ? 'border-violet-500/40 shadow-[0_0_0_3px_rgba(139,92,246,0.08)]'
                            : 'border-white/8 hover:border-white/12',
                        disabled && !isStreaming ? 'opacity-50' : '',
                    ].join(' ')}>

                        {/* Textarea */}
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={e => onInputChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder={
                                isOllamaOffline
                                    ? 'Start Ollama to begin chatting…'
                                    : selectedModel
                                        ? `Message ${selectedModel}…`
                                        : 'Select a model above to start…'
                            }
                            disabled={disabled || isStreaming}
                            rows={1}
                            style={{ minHeight: '52px', maxHeight: isMobile ? '120px' : '200px' }}
                            className="w-full px-4 pt-3.5 pb-3 bg-transparent resize-none focus:outline-none text-sm text-slate-100 placeholder:text-slate-600 disabled:cursor-not-allowed"
                            aria-label="Message input"
                        />

                        {/* Toolbar */}
                        <div className="flex items-center justify-between px-3 py-2 border-t border-white/5">

                            {/* Left: model pill + quick prompts + attachment */}
                            <div className="flex items-center gap-1">
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 text-[11px] font-medium mr-1">
                                    <Zap size={10} aria-hidden="true" />
                                    <span className="truncate max-w-17.5 sm:max-w-32.5">
                                        {selectedModel || 'No model'}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowQuickActions(p => !p)}
                                    aria-label="Quick prompts"
                                    aria-expanded={showQuickActions}
                                    className={[
                                        'p-1.5 rounded-lg transition-colors touch-manipulation',
                                        showQuickActions
                                            ? 'bg-violet-600/15 text-violet-400'
                                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5',
                                    ].join(' ')}
                                >
                                    <Smile size={16} />
                                </button>

                                <button
                                    type="button"
                                    disabled
                                    title="File attachment coming soon"
                                    aria-label="Attach file (coming soon)"
                                    className="p-1.5 rounded-lg text-slate-700 cursor-not-allowed"
                                >
                                    <Paperclip size={16} />
                                </button>
                            </div>

                            {/* Right: streaming status + char count + send/stop */}
                            <div className="flex items-center gap-2">
                                {isStreaming && (
                                    <span
                                        className="hidden sm:flex items-center gap-1.5 text-[11px] text-violet-400"
                                        role="status"
                                        aria-label="AI is generating"
                                    >
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                                        </span>
                                        Generating…
                                    </span>
                                )}

                                <span
                                    className={[
                                        'text-[11px] tabular-nums hidden sm:block',
                                        nearLimit ? 'text-amber-500' : 'text-slate-600',
                                    ].join(' ')}
                                    aria-live="polite"
                                >
                                    {charCount}/4000
                                </span>

                                {isStreaming ? (
                                    <button
                                        type="button"
                                        onClick={onStop}
                                        className="w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-400 active:bg-red-600 rounded-full transition-colors touch-manipulation shadow-md"
                                        aria-label="Stop generating"
                                    >
                                        <Square size={12} fill="currentColor" className="text-white" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={onSend}
                                        disabled={!canSend}
                                        className={[
                                            'w-8 h-8 flex items-center justify-center rounded-full transition-all touch-manipulation',
                                            canSend
                                                ? 'bg-violet-600 hover:bg-violet-500 active:bg-violet-700 shadow-md shadow-violet-950/40'
                                                : 'bg-white/6 text-slate-600 cursor-not-allowed',
                                        ].join(' ')}
                                        aria-label="Send message"
                                    >
                                        <ArrowUp size={15} className={canSend ? 'text-white' : ''} strokeWidth={2.5} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Keyboard hint */}
                    <p className="text-center text-[11px] text-slate-700 hidden sm:block select-none">
                        <kbd className="font-mono bg-white/5 border border-white/8 rounded px-1 text-[10px]">Enter</kbd> to send
                        &nbsp;·&nbsp;
                        <kbd className="font-mono bg-white/5 border border-white/8 rounded px-1 text-[10px]">Shift+Enter</kbd> for new line
                    </p>

                </div>
            </div>
        </div>
    );
};
