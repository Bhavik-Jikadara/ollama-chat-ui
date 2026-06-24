'use client';

import {
    MessageSquare, Trash2, Settings, Database,
    Sparkles, Plus, Clock, X, Search,
} from 'lucide-react';
import { Conversation } from '@/types/types';
import { format } from 'date-fns';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';

interface ConversationListProps {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    onCreateConversation: () => void;
    onDeleteConversation: (id: string) => void;
    onSelectConversation: (conversation: Conversation) => void;
    onShowSettings: () => void;
    isMobileSidebarOpen: boolean;
    onMobileSidebarToggle: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
    conversations,
    currentConversation,
    onCreateConversation,
    onDeleteConversation,
    onSelectConversation,
    onShowSettings,
    isMobileSidebarOpen,
    onMobileSidebarToggle,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    // Match the `lg:` CSS breakpoint so JS and CSS stay in sync
    const isMobile = useIsMobile(1024);

    const formatDate = (date: Date) => {
        const now = new Date();
        const d = new Date(date);
        const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
        if (days === 0) return format(d, 'HH:mm');
        if (days === 1) return 'Yesterday';
        if (days < 7) return format(d, 'EEE');
        return format(d, 'MM/dd');
    };

    const filtered = conversations.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const closeSidebar = () => isMobile && onMobileSidebarToggle();

    return (
        <>
            {/* Backdrop — only on mobile when open */}
            {isMobile && isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    onClick={onMobileSidebarToggle}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar panel */}
            <nav
                aria-label="Conversations"
                className={[
                    // Positioning: overlay on mobile, in-flow on desktop
                    'fixed lg:relative lg:translate-x-0 z-50',
                    // Width: full-width on xs, fixed panel on sm+, narrower on lg
                    'w-full sm:w-80 lg:w-64 xl:w-72',
                    'h-full flex flex-col bg-gray-900 border-r border-gray-800 shadow-2xl',
                    'transition-transform duration-300 ease-in-out',
                    // Slide in/out only when in mobile mode
                    isMobile
                        ? isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        : '',
                ].join(' ')}
            >
                {/* ── Header ── */}
                <div className="p-4 border-b border-gray-800 shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div
                                className="w-9 h-9 bg-linear-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0"
                                aria-hidden="true"
                            >
                                <Sparkles size={18} />
                            </div>
                            <div className="min-w-0">
                                <h1 className="font-bold text-base bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent truncate">
                                    Ollama UI
                                </h1>
                                <p className="text-xs text-gray-500 truncate">Local AI Assistant</p>
                            </div>
                        </div>
                        {/* Close button — only needed when sidebar is a drawer */}
                        {isMobile && (
                            <button
                                onClick={onMobileSidebarToggle}
                                className="shrink-0 p-2.5 hover:bg-gray-800 rounded-lg touch-manipulation"
                                aria-label="Close sidebar"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => { onCreateConversation(); closeSidebar(); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all touch-manipulation font-medium text-sm"
                    >
                        <Plus size={18} aria-hidden="true" />
                        New Chat
                    </button>
                </div>

                {/* ── Search ── */}
                <div className="px-3 py-2.5 border-b border-gray-800 shrink-0">
                    <div className="relative">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                            aria-hidden="true"
                        />
                        <input
                            type="search"
                            placeholder="Search conversations…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            aria-label="Search conversations"
                            className="w-full pl-8 pr-3 py-2 bg-gray-800 border border-gray-700/50 rounded-lg text-sm focus:outline-none focus:border-blue-500 placeholder:text-gray-600"
                        />
                    </div>
                </div>

                {/* ── Conversation list ── */}
                <div className="flex-1 overflow-y-auto px-2 py-2">
                    <p className="text-[10px] text-gray-600 px-2 py-1.5 font-semibold uppercase tracking-widest sticky top-0 bg-gray-900">
                        Chats ({filtered.length})
                    </p>

                    {filtered.length === 0 ? (
                        <div className="text-center py-10">
                            <MessageSquare size={40} className="mx-auto mb-3 text-gray-700" aria-hidden="true" />
                            <p className="text-sm text-gray-500">
                                {searchQuery ? 'No matches' : 'No conversations yet'}
                            </p>
                        </div>
                    ) : (
                        <ul className="space-y-0.5">
                            {filtered.map(conv => (
                                <li key={conv.id}>
                                    <button
                                        onClick={() => { onSelectConversation(conv); closeSidebar(); }}
                                        aria-current={currentConversation?.id === conv.id ? 'page' : undefined}
                                        className={[
                                            'group w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left touch-manipulation',
                                            currentConversation?.id === conv.id
                                                ? 'bg-blue-600/15 border border-blue-500/25 text-white'
                                                : 'hover:bg-gray-800/70 text-gray-300 hover:text-white',
                                        ].join(' ')}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <MessageSquare
                                                size={15}
                                                aria-hidden="true"
                                                className={`shrink-0 ${currentConversation?.id === conv.id ? 'text-blue-400' : 'text-gray-500'}`}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate leading-tight">{conv.title}</p>
                                                <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                                    <Clock size={9} aria-hidden="true" />
                                                    {conv.messageCount ?? 0} msgs
                                                    <span className="hidden sm:inline">· {formatDate(conv.updatedAt)}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Delete — visible on hover (desktop) or always on touch */}
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={e => { e.stopPropagation(); onDeleteConversation(conv.id); }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.stopPropagation(); e.preventDefault();
                                                    onDeleteConversation(conv.id);
                                                }
                                            }}
                                            aria-label={`Delete: ${conv.title}`}
                                            className="shrink-0 p-1.5 rounded-lg hover:bg-red-500/20 transition-all touch-manipulation opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} className="text-red-400" />
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="p-3 border-t border-gray-800 space-y-1 shrink-0">
                    <button
                        onClick={() => { onShowSettings(); closeSidebar(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800 rounded-xl transition-all touch-manipulation text-sm text-gray-400 hover:text-white"
                    >
                        <Settings size={16} aria-hidden="true" />
                        Settings
                    </button>
                    <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 bg-gray-800/40 rounded-lg">
                        <Database size={12} aria-hidden="true" />
                        Local · localStorage
                    </div>
                </div>
            </nav>

            {/* FAB removed — header hamburger already handles open on mobile */}
        </>
    );
};
