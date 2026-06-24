'use client';

import { ChevronDown, RefreshCw, Globe, Download, Check, Search, WifiOff } from 'lucide-react';
import { Model } from '@/types/types';
import { useState, useRef, useCallback } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useClickOutside } from '@/hooks/useClickOutside';
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
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const isMobile = useIsMobile();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useClickOutside(dropdownRef, useCallback(() => setIsOpen(false), []));

    const filteredModels = models.filter(model =>
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (model.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const close = useCallback(() => setIsOpen(false), []);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger button — compact on mobile, full on desktop */}
            <button
                onClick={() => setIsOpen(prev => !prev)}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label={`Select model${selectedModel ? `, current: ${selectedModel}` : ''}`}
                className={[
                    'flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-2 rounded-lg transition-all border touch-manipulation',
                    isOllamaOffline
                        ? 'bg-amber-900/20 border-amber-700/40 hover:bg-amber-900/30'
                        : 'bg-gray-800/50 hover:bg-gray-800 border-gray-700/50',
                    // Width: icon-only on xs, compact on sm, full on md
                    'px-2.5 sm:px-3 md:px-4',
                    'min-w-0 sm:min-w-[120px] md:min-w-[160px]',
                ].join(' ')}
            >
                {isOllamaOffline ? (
                    <WifiOff size={16} className="text-amber-500 shrink-0" aria-hidden="true" />
                ) : (
                    <span className="text-base shrink-0" aria-hidden="true">
                        {selectedModel ? getModelIcon(selectedModel) : '🤖'}
                    </span>
                )}
                {/* Hide label on xs so header doesn't overflow */}
                <span className="text-sm font-medium truncate flex-1 text-left hidden sm:block max-w-[80px] md:max-w-[120px]">
                    {isOllamaOffline
                        ? <span className="text-amber-500 text-xs">Offline</span>
                        : (selectedModel || 'Model')
                    }
                </span>
                <ChevronDown
                    size={16}
                    className={`transition-transform shrink-0 hidden sm:block ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                />
            </button>

            {isOpen && (
                <div
                    className={`
                        fixed md:absolute
                        ${isMobile ? 'inset-0 z-50 flex items-end justify-center bg-black/60' : 'right-0 mt-2 z-50'}
                    `}
                    onClick={isMobile ? close : undefined}
                >
                    <div
                        className={`
                            ${isMobile
                                ? 'w-full max-w-lg max-h-[85vh] bg-gray-900 border-t border-gray-700 rounded-t-2xl shadow-2xl'
                                : 'w-80 md:w-96 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl'
                            }
                            overflow-hidden flex flex-col
                        `}
                        onClick={e => e.stopPropagation()}
                        role="listbox"
                        aria-label="Available models"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-900">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">Models</span>
                                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                                    {models.length}
                                </span>
                                {isOllamaOffline && (
                                    <span className="text-xs text-amber-500 bg-amber-900/30 border border-amber-700/40 px-2 py-0.5 rounded flex items-center gap-1">
                                        <WifiOff size={10} aria-hidden="true" />
                                        Offline
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRefresh(); }}
                                    disabled={isLoading || isOllamaOffline}
                                    className="p-2 hover:bg-gray-800 rounded-lg transition-all touch-manipulation disabled:opacity-50"
                                    aria-label="Refresh model list"
                                >
                                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                                </button>
                                {isMobile && (
                                    <button
                                        onClick={close}
                                        className="p-2 hover:bg-gray-800 rounded-lg touch-manipulation"
                                        aria-label="Close"
                                    >
                                        <ChevronDown size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Offline message inside the panel */}
                        {isOllamaOffline && (
                            <div className="px-4 py-3 bg-amber-900/20 border-b border-amber-700/30 flex items-center gap-2 text-sm text-amber-400">
                                <WifiOff size={14} aria-hidden="true" />
                                Start Ollama to load models
                            </div>
                        )}

                        {/* Search */}
                        <div className="p-3 border-b border-gray-700">
                            <div className="relative">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                                <input
                                    type="search"
                                    placeholder="Search models…"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    aria-label="Search models"
                                    disabled={isOllamaOffline}
                                    className="w-full pl-9 pr-3 py-2.5 sm:py-3 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:opacity-40"
                                />
                            </div>
                        </div>

                        {/* Model list */}
                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="p-2 space-y-1" aria-busy="true" aria-label="Loading models">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="w-full p-4 flex items-start gap-3 animate-pulse">
                                            <div className="w-8 h-8 bg-gray-800 rounded-lg shrink-0" />
                                            <div className="flex-1 space-y-2 py-1">
                                                <div className="h-4 bg-gray-800 rounded w-24" />
                                                <div className="h-3 bg-gray-800 rounded w-full" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : filteredModels.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <Globe size={32} className="mx-auto mb-3 opacity-50" aria-hidden="true" />
                                    <p className="text-sm mb-2">
                                        {isOllamaOffline ? 'Ollama is not running' : 'No models found'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {isOllamaOffline
                                            ? 'Run: ollama serve'
                                            : 'Install models with: ollama pull <name>'}
                                    </p>
                                </div>
                            ) : (
                                filteredModels.map(model => (
                                    <button
                                        key={model.name}
                                        role="option"
                                        aria-selected={selectedModel === model.name}
                                        onClick={() => { onSelectModel(model.name); close(); }}
                                        className={`w-full p-4 text-left hover:bg-gray-800/50 transition-all border-l-2 flex items-center justify-between group ${
                                            selectedModel === model.name
                                                ? 'border-blue-500 bg-blue-500/10'
                                                : 'border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <span className="text-2xl shrink-0" aria-hidden="true">
                                                {getModelIcon(model.name)}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm truncate">{model.name}</span>
                                                    {selectedModel === model.name && (
                                                        <Check size={14} className="text-blue-400 shrink-0" aria-hidden="true" />
                                                    )}
                                                </div>
                                                {model.description && (
                                                    <p className="text-xs text-gray-400 mt-0.5 truncate">{model.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        {model.size && (
                                            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded ml-2 shrink-0">
                                                {model.size}
                                            </span>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-gray-700 bg-gray-800/30 flex items-center justify-between sticky bottom-0">
                            <a
                                href="https://ollama.ai/library"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 touch-manipulation"
                                onClick={close}
                            >
                                <Download size={14} aria-hidden="true" />
                                <span>Browse more models</span>
                            </a>
                            <span className="text-xs text-gray-500">Local inference</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
