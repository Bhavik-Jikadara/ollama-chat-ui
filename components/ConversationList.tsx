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
            {/* Backdrop */}
            {isMobile && isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
                    onClick={onMobileSidebarToggle}
                    aria-hidden="true"
                />
            )}

            <nav
                aria-label="Conversations"
                className={[
                    'fixed lg:relative lg:translate-x-0 z-50',
                    'w-72 sm:w-72 lg:w-60 xl:w-72',
                    'h-full flex flex-col',
                    'bg-[#130f28] border-r border-white/[0.06]',
                    'transition-transform duration-300 ease-in-out',
                    isMobile
                        ? isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        : '',
                ].join(' ')}
            >
                {/* ── Header ── */}
                <div className="px-4 pt-5 pb-4 shrink-0">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div
                                className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center shrink-0"
                                aria-hidden="true"
                            >
                                <Sparkles size={15} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="font-semibold text-[13px] text-white truncate leading-tight">Ollama UI</h1>
                                <p className="text-[11px] text-slate-500 truncate">Local AI Assistant</p>
                            </div>
                        </div>
                        {isMobile && (
                            <button
                                onClick={onMobileSidebarToggle}
                                className="p-1.5 hover:bg-white/5 rounded-lg touch-manipulation shrink-0"
                                aria-label="Close sidebar"
                            >
                                <X size={17} className="text-slate-400" />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => { onCreateConversation(); closeSidebar(); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 rounded-xl transition-colors touch-manipulation text-sm font-medium text-white"
                    >
                        <Plus size={16} aria-hidden="true" />
                        New Chat
                    </button>
                </div>

                {/* ── Search ── */}
                <div className="px-3 pb-3 shrink-0">
                    <div className="relative">
                        <Search
                            size={13}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                            aria-hidden="true"
                        />
                        <input
                            type="search"
                            placeholder="Search chats…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            aria-label="Search conversations"
                            className="w-full pl-8 pr-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-[13px] text-slate-300 focus:outline-none focus:border-violet-500/40 focus:bg-white/6 placeholder:text-slate-600 transition-colors"
                        />
                    </div>
                </div>

                {/* ── Divider ── */}
                <div className="h-px mx-3 bg-white/[0.06] shrink-0" />

                {/* ── List ── */}
                <div className="flex-1 overflow-y-auto py-2">
                    {conversations.length > 0 && (
                        <p className="px-4 py-1.5 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
                            {searchQuery ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : `Recent (${conversations.length})`}
                        </p>
                    )}

                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center py-12 px-4 text-center">
                            <div className="w-10 h-10 bg-white/[0.03] rounded-xl flex items-center justify-center mb-3">
                                <MessageSquare size={18} className="text-slate-600" aria-hidden="true" />
                            </div>
                            <p className="text-[13px] text-slate-500 font-medium">
                                {searchQuery ? 'No matches found' : 'No conversations yet'}
                            </p>
                            {!searchQuery && (
                                <p className="text-xs text-slate-600 mt-1">Click New Chat to start</p>
                            )}
                        </div>
                    ) : (
                        <ul className="px-2 space-y-px">
                            {filtered.map(conv => {
                                const isActive = currentConversation?.id === conv.id;
                                return (
                                    <li key={conv.id} className="relative group">
                                        <button
                                            type="button"
                                            onClick={() => { onSelectConversation(conv); closeSidebar(); }}
                                            aria-current={isActive ? 'page' : undefined}
                                            className={[
                                                'w-full flex items-start gap-2.5 px-3 py-2.5 pr-8 rounded-xl transition-colors text-left touch-manipulation',
                                                isActive
                                                    ? 'bg-violet-600/12 text-white'
                                                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200',
                                            ].join(' ')}
                                        >
                                            {/* Active left bar */}
                                            {isActive && (
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-violet-500 rounded-r-full" aria-hidden="true" />
                                            )}

                                            <MessageSquare
                                                size={13}
                                                className={`shrink-0 mt-0.5 ${isActive ? 'text-violet-400' : 'text-slate-600'}`}
                                                aria-hidden="true"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[13px] font-medium truncate leading-snug">{conv.title}</p>
                                                <p className="flex items-center gap-1 text-[11px] text-slate-600 mt-0.5">
                                                    <Clock size={8} aria-hidden="true" />
                                                    {conv.messageCount ?? 0} msgs
                                                    <span className="text-slate-700 hidden sm:inline">·</span>
                                                    <span className="hidden sm:inline">{formatDate(conv.updatedAt)}</span>
                                                </p>
                                            </div>
                                        </button>

                                        {/* Delete — sibling button, absolutely positioned */}
                                        <button
                                            type="button"
                                            onClick={() => onDeleteConversation(conv.id)}
                                            aria-label={`Delete: ${conv.title}`}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-all touch-manipulation opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="shrink-0">
                    <div className="h-px mx-3 bg-white/[0.06]" />
                    <div className="px-3 py-3 space-y-px">
                        <button
                            onClick={() => { onShowSettings(); closeSidebar(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors touch-manipulation"
                        >
                            <Settings size={14} className="shrink-0" aria-hidden="true" />
                            Settings
                        </button>
                        <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-slate-600 rounded-lg">
                            <Database size={10} aria-hidden="true" />
                            Stored locally · localStorage
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
};
