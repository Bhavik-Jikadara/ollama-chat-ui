'use client';

import { ChevronDown, RefreshCw, Globe, Download, Check, Search, WifiOff } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Model } from '@/types/types';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { getModelIcon } from '@/lib/model-utils';

interface ModelDropdownProps {
    models: Model[];
    selectedModel: string;
    onSelectModel: (model: string) => void;
    isLoading: boolean;
    onRefresh: () => void;
    isOllamaOffline?: boolean;
}

export const ModelDropdown: React.FC<ModelDropdownProps> = ({
    models: rawModels,
    selectedModel,
    onSelectModel,
    isLoading,
    onRefresh,
    isOllamaOffline = false,
}) => {
    const models = Array.isArray(rawModels) ? rawModels : [];
    const [isOpen, setIsOpen]     = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [mounted, setMounted]   = useState(false);
    const isMobile                = useIsMobile();
    const triggerRef              = useRef<HTMLButtonElement>(null);
    const dropdownRef             = useRef<HTMLDivElement>(null);
    const sheetRef                = useRef<HTMLDivElement>(null);

    // Portal requires document — only available after mount
    useEffect(() => { setMounted(true); }, []);

    const close = useCallback(() => { setIsOpen(false); setSearchTerm(''); }, []);

    // Click-outside + Escape: desktop uses dropdownRef; mobile uses sheetRef via portal
    useEffect(() => {
        if (!isOpen) return;
        const onMouse = (e: MouseEvent) => {
            const t = e.target as Node;
            // Keep open if click is inside trigger or inside the sheet/dropdown panel
            const inTrigger   = triggerRef.current?.contains(t);
            const inDropdown  = dropdownRef.current?.contains(t);
            const inSheet     = sheetRef.current?.contains(t);
            if (!inTrigger && !inDropdown && !inSheet) close();
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
        document.addEventListener('mousedown', onMouse);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onMouse);
            document.removeEventListener('keydown', onKey);
        };
    }, [isOpen, close]);

    const filteredModels = models.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    /* ── Shared model list items ──────────────────────────────────────────── */
    const modelItems = isLoading ? (
        <div className="p-3 space-y-1" aria-busy="true" aria-label="Loading models">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                    <div className="w-8 h-8 bg-white/6 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-white/6 rounded w-28" />
                        <div className="h-3 bg-white/4 rounded w-full" />
                    </div>
                </div>
            ))}
        </div>
    ) : filteredModels.length === 0 ? (
        <div className="py-10 px-4 text-center">
            <Globe size={28} className="mx-auto mb-3 text-slate-700" aria-hidden="true" />
            <p className="text-sm text-slate-400 mb-1">
                {isOllamaOffline ? 'Ollama is not running' : 'No models found'}
            </p>
            <p className="text-xs text-slate-600">
                {isOllamaOffline ? 'Run: ollama serve' : 'ollama pull <name>'}
            </p>
        </div>
    ) : filteredModels.map(model => (
        <button
            key={model.name}
            role="option"
            aria-selected={selectedModel === model.name}
            onClick={() => { onSelectModel(model.name); close(); }}
            className={`w-full px-4 py-3.5 text-left flex items-center gap-3 transition-colors border-l-2 ${
                selectedModel === model.name
                    ? 'border-violet-500 bg-violet-600/10'
                    : 'border-transparent hover:bg-white/4'
            }`}
        >
            <span className="text-2xl shrink-0 leading-none" aria-hidden="true">
                {getModelIcon(model.name)}
            </span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-100 truncate">{model.name}</span>
                    {selectedModel === model.name && (
                        <Check size={13} className="text-violet-400 shrink-0" aria-hidden="true" />
                    )}
                </div>
                {model.description && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{model.description}</p>
                )}
            </div>
            {model.size && (
                <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded ml-1 shrink-0">
                    {model.size}
                </span>
            )}
        </button>
    ));

    /* ── Mobile bottom-sheet (portal — escapes all stacking contexts) ─────── */
    const mobilePortal = mounted && isMobile && isOpen
        ? createPortal(
            <>
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/70"
                    style={{ zIndex: 9998 }}
                    onClick={close}
                />

                {/* Sheet */}
                <div
                    ref={sheetRef}
                    className="fixed inset-x-0 bottom-0 bg-[#130f28] rounded-t-2xl shadow-2xl border-t border-white/8 flex flex-col animate-slide-up overflow-hidden"
                    style={{ zIndex: 9999, maxHeight: '80vh' }}
                    role="listbox"
                    aria-label="Available models"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/6 shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">Models</span>
                            <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                                {models.length}
                            </span>
                            {isOllamaOffline && (
                                <span className="text-xs text-amber-400 bg-amber-950/40 border border-amber-700/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <WifiOff size={9} aria-hidden="true" />
                                    Offline
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={e => { e.stopPropagation(); onRefresh(); }}
                                disabled={isLoading || isOllamaOffline}
                                className="p-2 hover:bg-white/6 rounded-lg transition-colors touch-manipulation disabled:opacity-40"
                                aria-label="Refresh model list"
                            >
                                <RefreshCw size={15} className={`text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={close}
                                className="p-2 hover:bg-white/6 rounded-lg touch-manipulation"
                                aria-label="Close"
                            >
                                <ChevronDown size={18} className="text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Offline notice */}
                    {isOllamaOffline && (
                        <div className="px-4 py-2.5 bg-amber-950/20 border-b border-amber-800/20 flex items-center gap-2 text-sm text-amber-400 shrink-0">
                            <WifiOff size={13} aria-hidden="true" />
                            Start Ollama to load models
                        </div>
                    )}

                    {/* Search */}
                    <div className="px-3 py-2.5 border-b border-white/6 shrink-0">
                        <div className="relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                            <input
                                type="search"
                                placeholder="Search models…"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                aria-label="Search models"
                                disabled={isOllamaOffline}
                                className="w-full pl-8 pr-3 py-2.5 bg-white/4 border border-white/6 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-violet-500/40 placeholder:text-slate-600 disabled:opacity-40"
                            />
                        </div>
                    </div>

                    {/* Model list — min-h-0 lets flex-1 shrink so max-h is respected */}
                    <div className="overflow-y-auto flex-1 min-h-0" role="group">
                        {modelItems}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-white/6 flex items-center justify-between shrink-0 bg-[#130f28]">
                        <a
                            href="https://ollama.ai/library"
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="flex items-center gap-2 text-xs text-violet-400 hover:text-violet-300 touch-manipulation"
                            onClick={close}
                            aria-label="Browse more models on Ollama (opens in new tab)"
                        >
                            <Download size={13} aria-hidden="true" />
                            Browse more models
                        </a>
                        <span className="text-xs text-slate-600">Local inference</span>
                    </div>
                </div>
            </>,
            document.body
        )
        : null;

    return (
        <>
            <div className="relative" ref={dropdownRef}>
                {/* ── Trigger ── */}
                <button
                    ref={triggerRef}
                    onClick={() => setIsOpen(p => !p)}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    aria-label={`Select model${selectedModel ? `, current: ${selectedModel}` : ''}`}
                    className={[
                        'flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl border transition-colors touch-manipulation',
                        isOllamaOffline
                            ? 'bg-amber-950/30 border-amber-700/30 hover:bg-amber-950/50'
                            : isOpen
                                ? 'bg-violet-600/15 border-violet-500/30 text-white'
                                : 'bg-white/5 border-white/8 hover:bg-white/8 hover:border-white/12',
                        'min-w-0 sm:min-w-30 md:min-w-37.5',
                    ].join(' ')}
                >
                    {isOllamaOffline ? (
                        <WifiOff size={15} className="text-amber-500 shrink-0" aria-hidden="true" />
                    ) : (
                        <span className="text-base shrink-0 leading-none" aria-hidden="true">
                            {selectedModel ? getModelIcon(selectedModel) : '🤖'}
                        </span>
                    )}
                    <span className="text-sm font-medium truncate flex-1 text-left hidden sm:block max-w-20 md:max-w-28">
                        {isOllamaOffline
                            ? <span className="text-amber-400 text-xs">Offline</span>
                            : (selectedModel || 'Model')}
                    </span>
                    <ChevronDown
                        size={14}
                        className={`transition-transform shrink-0 hidden sm:block text-slate-500 ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                    />
                </button>

                {/* ── Desktop: positioned dropdown ── */}
                {!isMobile && isOpen && (
                    <div className="absolute right-0 mt-2 z-50 w-80 md:w-96">
                        <div
                            className="bg-[#130f28] border border-white/8 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                            style={{ maxHeight: '70vh' }}
                            role="listbox"
                            aria-label="Available models"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/6 shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-white">Models</span>
                                    <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                                        {models.length}
                                    </span>
                                    {isOllamaOffline && (
                                        <span className="text-xs text-amber-400 bg-amber-950/40 border border-amber-700/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <WifiOff size={9} aria-hidden="true" />
                                            Offline
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={e => { e.stopPropagation(); onRefresh(); }}
                                    disabled={isLoading || isOllamaOffline}
                                    className="p-1.5 hover:bg-white/6 rounded-lg transition-colors touch-manipulation disabled:opacity-40"
                                    aria-label="Refresh model list"
                                >
                                    <RefreshCw size={14} className={`text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            {/* Offline notice */}
                            {isOllamaOffline && (
                                <div className="px-4 py-2.5 bg-amber-950/20 border-b border-amber-800/20 flex items-center gap-2 text-sm text-amber-400 shrink-0">
                                    <WifiOff size={13} aria-hidden="true" />
                                    Start Ollama to load models
                                </div>
                            )}

                            {/* Search */}
                            <div className="px-3 py-2.5 border-b border-white/6 shrink-0">
                                <div className="relative">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                                    <input
                                        type="search"
                                        placeholder="Search models…"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        aria-label="Search models"
                                        disabled={isOllamaOffline}
                                        className="w-full pl-8 pr-3 py-2 bg-white/4 border border-white/6 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-violet-500/40 placeholder:text-slate-600 disabled:opacity-40"
                                    />
                                </div>
                            </div>

                            {/* Model list */}
                            <div className="overflow-y-auto flex-1 min-h-0">
                                {modelItems}
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-3 border-t border-white/6 flex items-center justify-between shrink-0">
                                <a
                                    href="https://ollama.ai/library"
                                    target="_blank"
                                    rel="noopener noreferrer nofollow"
                                    className="flex items-center gap-2 text-xs text-violet-400 hover:text-violet-300 touch-manipulation"
                                    onClick={close}
                                    aria-label="Browse more models on Ollama (opens in new tab)"
                                >
                                    <Download size={13} aria-hidden="true" />
                                    Browse more models
                                </a>
                                <span className="text-xs text-slate-600">Local inference</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile portal renders outside all stacking contexts at document.body */}
            {mobilePortal}
        </>
    );
};
