'use client';

import { Sparkles, Copy, ThumbsUp, ThumbsDown, Check, User, Bot } from 'lucide-react';
import { Message as MessageType } from '@/types/types';
import { useState } from 'react';

interface MessageListProps {
    messages: MessageType[];
    selectedModel: string;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    onSendPrompt?: (text: string) => void;
}

const SUGGESTIONS = [
    { icon: '💡', label: 'Brainstorm ideas',  prompt: 'Give me 5 creative project ideas I can start this weekend' },
    { icon: '💻', label: 'Write code',         prompt: 'Write a Python function that reads a CSV and returns summary stats' },
    { icon: '📚', label: 'Explain something',  prompt: 'Explain how transformers work in simple terms' },
    { icon: '✍️', label: 'Creative writing',   prompt: 'Write a short story about a robot who learns to paint' },
];

export const MessageList: React.FC<MessageListProps> = ({
    messages,
    selectedModel,
    messagesEndRef,
    onSendPrompt,
}) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    /* ── Empty state ─────────────────────────────────────────────────────── */
    if (messages.length === 0) {
        return (
            <div className="flex-1 overflow-y-auto flex items-center justify-center px-4 py-10">
                <div className="w-full max-w-md text-center">
                    {/* Icon badge */}
                    <div className="relative mx-auto w-14 h-14 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-violet-400" aria-hidden="true" />
                        </div>
                        <span
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-violet-500 rounded-full border-2 border-[#0d0a1a]"
                            aria-hidden="true"
                        />
                    </div>

                    <h2 className="text-lg font-semibold text-white mb-1.5">How can I help you?</h2>
                    <p className="text-sm text-slate-500 mb-8">
                        {selectedModel
                            ? <>Chatting with <span className="text-slate-400 font-medium">{selectedModel}</span></>
                            : 'Select a model to start chatting'}
                    </p>

                    {/* Suggestion grid */}
                    <div className="grid grid-cols-2 gap-2">
                        {SUGGESTIONS.map(s => (
                            <button
                                key={s.label}
                                type="button"
                                onClick={() => onSendPrompt?.(s.prompt)}
                                disabled={!onSendPrompt}
                                className="group flex flex-col items-start gap-2 p-3.5 rounded-xl bg-white/3 hover:bg-violet-600/10 border border-white/6 hover:border-violet-500/25 text-left transition-all active:scale-[0.98] touch-manipulation disabled:pointer-events-none disabled:opacity-40"
                            >
                                <span className="text-xl" aria-hidden="true">{s.icon}</span>
                                <span className="text-[13px] font-medium text-slate-300 group-hover:text-white leading-tight">
                                    {s.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <p className="mt-8 text-[11px] text-slate-600">
                        Powered by Ollama · Runs 100% locally
                    </p>
                </div>
            </div>
        );
    }

    /* ── Message list ────────────────────────────────────────────────────── */
    return (
        <div
            className="flex-1 overflow-y-auto"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
        >
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
                {messages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    const dateObj = new Date(msg.createdAt);

                    return (
                        <div
                            key={msg.id}
                            className={`flex gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                            style={{ animationDelay: `${Math.min(idx * 0.02, 0.3)}s` }}
                        >
                            {/* Avatar */}
                            <div
                                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm mt-0.5 ${
                                    isUser
                                        ? 'bg-violet-600 text-white'
                                        : 'bg-[#231a4a] border border-white/8 text-emerald-400'
                                }`}
                                aria-hidden="true"
                            >
                                {isUser ? <User size={14} /> : <Bot size={14} />}
                            </div>

                            {/* Content column */}
                            <div className={`group flex flex-col gap-1.5 min-w-0 max-w-[84%] ${isUser ? 'items-end' : 'items-start'}`}>
                                {/* Sender + timestamp */}
                                <div className={`flex items-center gap-2 px-0.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <span className="text-xs font-medium text-slate-400">
                                        {isUser ? 'You' : (selectedModel || 'Assistant')}
                                    </span>
                                    <time
                                        className="text-[11px] text-slate-600"
                                        dateTime={dateObj.toISOString()}
                                    >
                                        {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </time>
                                </div>

                                {/* Bubble */}
                                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap wrap-break-word ${
                                    isUser
                                        ? 'bg-violet-600 text-white rounded-tr-sm shadow-lg shadow-violet-950/30'
                                        : 'bg-[#1a1535] border border-white/8 text-slate-100 rounded-tl-sm'
                                }`}>
                                    {msg.content}
                                </div>

                                {/* Action row — assistant only, reveal on hover */}
                                {!isUser && (
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(msg.content, msg.id)}
                                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/6 transition-colors touch-manipulation"
                                            aria-label={copiedId === msg.id ? 'Copied!' : 'Copy message'}
                                        >
                                            {copiedId === msg.id
                                                ? <Check size={13} className="text-emerald-400" />
                                                : <Copy size={13} />
                                            }
                                        </button>
                                        <button
                                            type="button"
                                            className="p-1.5 rounded-lg text-slate-600 hover:text-violet-400 hover:bg-white/6 transition-colors touch-manipulation"
                                            aria-label="Like this response"
                                        >
                                            <ThumbsUp size={13} />
                                        </button>
                                        <button
                                            type="button"
                                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-white/6 transition-colors touch-manipulation"
                                            aria-label="Dislike this response"
                                        >
                                            <ThumbsDown size={13} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                <div ref={messagesEndRef} className="h-1" aria-hidden="true" />
            </div>
        </div>
    );
};
