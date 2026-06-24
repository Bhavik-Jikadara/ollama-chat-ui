'use client';

import { Sparkles, User, Bot, Copy, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { Message as MessageType } from '@/types/types';
import { useState } from 'react';

interface MessageListProps {
    messages: MessageType[];
    selectedModel: string;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const MessageList: React.FC<MessageListProps> = ({
    messages,
    selectedModel,
    messagesEndRef,
}) => {
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

    const copyToClipboard = async (text: string, messageId: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedMessageId(messageId);
            setTimeout(() => setCopiedMessageId(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (messages.length === 0) {
        return (
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="h-full flex items-center justify-center px-4">
                    <div className="text-center max-w-md w-full">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="text-white w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10" aria-hidden="true" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold mb-3 bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Start a Conversation
                        </h2>
                        <p className="text-gray-400 mb-6 text-sm md:text-base px-2">
                            Ask me anything or upload documents for RAG-powered answers
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-sm">
                            {[
                                { icon: '💡', title: 'Get Ideas', desc: 'Brainstorm and create' },
                                { icon: '💻', title: 'Write Code', desc: 'Debug and develop' },
                                { icon: '📚', title: 'Learn Things', desc: 'Ask questions' },
                                { icon: '✨', title: 'Be Creative', desc: 'Write and imagine' },
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    className="p-3 sm:p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 text-left hover:bg-gray-800/50 transition-all cursor-pointer active:scale-[0.98] touch-manipulation"
                                >
                                    <div className="text-xl sm:text-2xl mb-1" aria-hidden="true">{item.icon}</div>
                                    <div className="font-medium text-xs sm:text-sm">{item.title}</div>
                                    <div className="text-xs text-gray-500 mt-0.5 hidden sm:block">{item.desc}</div>
                                </div>
                            ))}
                        </div>
                        <p className="mt-6 md:mt-8 text-xs text-gray-500">
                            Powered by Ollama • Runs locally on your machine
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex-1 overflow-y-auto p-3 pb-4 sm:p-4 sm:pb-6 lg:p-6 space-y-5 sm:space-y-6"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
        >
            {messages.map((msg, idx) => (
                <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    style={{ animationDelay: `${idx * 0.02}s` }}
                >
                    {/* Bubble width: tighter on mobile, wider on desktop */}
                    <div className={`
                        group w-full
                        max-w-[95%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-3xl
                        ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}
                    `}>
                        {/* Role label + timestamp */}
                        <div className="flex items-center gap-2 mb-1 px-1">
                            <div
                                className={`p-1 rounded-full shrink-0 ${msg.role === 'user' ? 'bg-blue-500/20' : 'bg-gray-800'}`}
                                aria-hidden="true"
                            >
                                {msg.role === 'user' ? (
                                    <User size={13} className="text-blue-400" />
                                ) : (
                                    <Bot size={13} className="text-green-400" />
                                )}
                            </div>
                            <span className="text-xs font-semibold text-gray-300 truncate max-w-[100px] sm:max-w-none">
                                {msg.role === 'user' ? 'You' : selectedModel || 'Assistant'}
                            </span>
                            <time
                                className="text-xs text-gray-500 shrink-0 ml-auto"
                                dateTime={new Date(msg.createdAt).toISOString()}
                            >
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </time>
                        </div>

                        {/* Bubble */}
                        <div
                            className={`px-3.5 py-3 sm:px-4 sm:py-3.5 md:px-5 md:py-4 rounded-xl sm:rounded-2xl shadow-lg ${
                                msg.role === 'user'
                                    ? 'bg-linear-to-br from-blue-600 to-blue-700'
                                    : 'bg-gray-800/50 backdrop-blur-sm border border-gray-700/50'
                            }`}
                        >
                            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap wrap-break-word">
                                {msg.content}
                            </p>
                        </div>

                        {/* Action bar — always visible on mobile, hover-only on desktop */}
                        {msg.role === 'assistant' && (
                            <div className="flex items-center gap-0.5 mt-1.5 sm:opacity-0 sm:translate-y-1 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 sm:transition-all sm:duration-200">
                                <button
                                    onClick={() => copyToClipboard(msg.content, msg.id)}
                                    className="p-2 hover:bg-gray-800 rounded-lg transition-all touch-manipulation"
                                    aria-label={copiedMessageId === msg.id ? 'Copied' : 'Copy message'}
                                >
                                    {copiedMessageId === msg.id ? (
                                        <Check size={15} className="text-green-400" />
                                    ) : (
                                        <Copy size={15} className="text-gray-500 hover:text-gray-300" />
                                    )}
                                </button>
                                <button
                                    className="p-2 hover:bg-gray-800 rounded-lg transition-all touch-manipulation"
                                    aria-label="Like this response"
                                >
                                    <ThumbsUp size={15} className="text-gray-500 hover:text-gray-300" />
                                </button>
                                <button
                                    className="p-2 hover:bg-gray-800 rounded-lg transition-all touch-manipulation"
                                    aria-label="Dislike this response"
                                >
                                    <ThumbsDown size={15} className="text-gray-500 hover:text-gray-300" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} className="h-2 sm:h-4" aria-hidden="true" />
        </div>
    );
};
