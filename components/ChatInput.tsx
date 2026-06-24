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

    const adjustTextareaHeight = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, isMobile ? 120 : 200)}px`;
    }, [isMobile]);

    useEffect(() => { adjustTextareaHeight(); }, [adjustTextareaHeight, input]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isStreaming && input.trim() && !disabled) onSend();
        }
    };

    const canSend = !disabled && !isStreaming && input.trim().length > 0;
    const charCount = input.length;
    const charWarning = charCount > 3600;

    return (
        <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800">
            {/* Offline banner */}
            {isOllamaOffline && (
                <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-950/60 border-b border-amber-800/50 text-amber-400 text-xs font-medium">
                    <WifiOff size={12} aria-hidden="true" />
                    Ollama is not running — run <code className="font-mono bg-amber-900/40 px-1 rounded">ollama serve</code> to enable chat
                </div>
            )}

            <div className="px-3 sm:px-4 pt-3 pb-3 sm:pb-4">
                <div className="max-w-4xl mx-auto space-y-2">

                    {/* Quick Prompts — above the card on desktop, bottom sheet on mobile */}
                    {showQuickActions && (
                        <>
                            {isMobile ? (
                                <div className="fixed inset-0 z-50 flex items-end bg-black/60">
                                    <div
                                        ref={quickActionsRef}
                                        className="w-full bg-gray-900 border-t border-gray-700/80 rounded-t-2xl shadow-2xl max-h-[75vh] overflow-y-auto animate-slide-up"
                                    >
                                        <div className="p-4 flex items-center justify-between border-b border-gray-800 sticky top-0 bg-gray-900">
                                            <h3 className="font-semibold text-sm text-gray-200">Quick Prompts</h3>
                                            <button
                                                onClick={() => setShowQuickActions(false)}
                                                className="p-2 hover:bg-gray-800 rounded-lg touch-manipulation"
                                                aria-label="Close"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                        <div className="p-3 grid grid-cols-1 gap-2">
                                            {QUICK_PROMPTS.map((p) => (
                                                <button
                                                    key={p.label}
                                                    onClick={() => { onInputChange(p.label); setShowQuickActions(false); }}
                                                    className="flex items-center gap-3 w-full px-4 py-3.5 text-left bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 rounded-xl transition-all touch-manipulation active:scale-[0.98]"
                                                >
                                                    <span className="text-xl shrink-0" aria-hidden="true">{p.icon}</span>
                                                    <span className="text-sm text-gray-200">{p.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    ref={quickActionsRef}
                                    className="bg-gray-850 border border-gray-700/70 rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
                                    style={{ background: '#1a1f2e' }}
                                >
                                    <div className="px-4 py-3 border-b border-gray-700/60 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick Prompts</span>
                                        <button
                                            onClick={() => setShowQuickActions(false)}
                                            className="p-1.5 hover:bg-gray-700/60 rounded-lg"
                                            aria-label="Close"
                                        >
                                            <X size={15} className="text-gray-500" />
                                        </button>
                                    </div>
                                    <div className="p-3 grid grid-cols-2 gap-2">
                                        {QUICK_PROMPTS.map((p) => (
                                            <button
                                                key={p.label}
                                                onClick={() => { onInputChange(p.label); setShowQuickActions(false); textareaRef.current?.focus(); }}
                                                className="flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600/60 rounded-xl transition-all group"
                                            >
                                                <span className="text-base shrink-0" aria-hidden="true">{p.icon}</span>
                                                <span className="text-xs text-gray-300 group-hover:text-white truncate">{p.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Unified input card ── */}
                    <div className={[
                        'flex flex-col rounded-2xl border transition-all duration-200',
                        isFocused
                            ? 'border-blue-500/70 shadow-[0_0_0_3px_rgba(59,130,246,0.12)]'
                            : 'border-gray-700/70 hover:border-gray-600/80',
                        disabled && !isStreaming ? 'opacity-60' : '',
                    ].join(' ')}
                        style={{ background: '#1e2330' }}
                    >
                        {/* Textarea */}
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => onInputChange(e.target.value)}
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
                            className="w-full px-4 pt-4 pb-3 bg-transparent resize-none focus:outline-none text-sm sm:text-[15px] text-gray-100 placeholder:text-gray-500 disabled:cursor-not-allowed"
                            style={{ minHeight: '56px', maxHeight: isMobile ? '120px' : '220px' }}
                            rows={1}
                            aria-label="Message input"
                            aria-multiline="true"
                        />

                        {/* ── Bottom toolbar ── */}
                        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-700/50">

                            {/* Left side: model pill + action buttons */}
                            <div className="flex items-center gap-1">
                                {/* Active model pill */}
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-medium mr-1">
                                    <Zap size={11} aria-hidden="true" />
                                    <span className="truncate max-w-[80px] sm:max-w-[140px]">
                                        {selectedModel || 'No model'}
                                    </span>
                                </div>

                                {/* Quick prompts */}
                                <button
                                    type="button"
                                    onClick={() => setShowQuickActions(prev => !prev)}
                                    aria-label="Quick prompts"
                                    aria-expanded={showQuickActions}
                                    className={[
                                        'p-1.5 rounded-lg transition-all touch-manipulation',
                                        showQuickActions
                                            ? 'bg-blue-500/15 text-blue-400'
                                            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700/60',
                                    ].join(' ')}
                                >
                                    <Smile size={17} />
                                </button>

                                {/* Attachment — placeholder for a future feature */}
                                <button
                                    type="button"
                                    disabled
                                    title="File attachment coming soon"
                                    aria-label="Attach file (coming soon)"
                                    className="p-1.5 rounded-lg text-gray-600 cursor-not-allowed"
                                >
                                    <Paperclip size={17} />
                                </button>
                            </div>

                            {/* Right side: streaming hint + char count + send/stop */}
                            <div className="flex items-center gap-2">
                                {isStreaming && (
                                    <span
                                        className="hidden sm:flex items-center gap-1.5 text-[11px] text-blue-400"
                                        role="status"
                                        aria-label="AI is generating"
                                    >
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                                        </span>
                                        Generating…
                                    </span>
                                )}

                                {/* Character count */}
                                <span
                                    className={[
                                        'text-[11px] tabular-nums hidden sm:block',
                                        charWarning ? 'text-amber-500' : 'text-gray-600',
                                    ].join(' ')}
                                    aria-live="polite"
                                >
                                    {charCount}/4000
                                </span>

                                {/* Send / Stop button */}
                                {isStreaming ? (
                                    <button
                                        type="button"
                                        onClick={onStop}
                                        className="w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 active:bg-red-700 rounded-full transition-all touch-manipulation shadow-md"
                                        aria-label="Stop generating"
                                    >
                                        <Square size={13} fill="currentColor" className="text-white" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={onSend}
                                        disabled={!canSend}
                                        className={[
                                            'w-8 h-8 flex items-center justify-center rounded-full transition-all touch-manipulation shadow-md',
                                            canSend
                                                ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-blue-900/40'
                                                : 'bg-gray-700 cursor-not-allowed',
                                        ].join(' ')}
                                        aria-label="Send message"
                                    >
                                        <ArrowUp size={16} className="text-white" strokeWidth={2.5} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Keyboard hint */}
                    <p className="text-center text-[11px] text-gray-600 hidden sm:block select-none">
                        <kbd className="font-mono bg-gray-800 border border-gray-700 rounded px-1 text-[10px]">Enter</kbd> to send
                        &nbsp;·&nbsp;
                        <kbd className="font-mono bg-gray-800 border border-gray-700 rounded px-1 text-[10px]">Shift+Enter</kbd> for new line
                    </p>

                </div>
            </div>
        </div>
    );
};
