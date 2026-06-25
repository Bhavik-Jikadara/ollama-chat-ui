'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, AlertCircle, Menu, RefreshCw } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useOllama, OllamaStatus } from '@/hooks/useOllama';
import { Message as MessageType } from '@/types/types';
import { chatHistory } from '@/lib/chat-history';
import { getModelIcon } from '@/lib/model-utils';
import { ModelDropdown } from '@/components/ModelDropdown';
import { SettingsPanel } from '@/components/SettingsPanel';
import { ConversationList } from '@/components/ConversationList';
import { MessageList } from '@/components/MessageList';
import { ChatInput } from '@/components/ChatInput';

/* ─── Ollama offline / checking state ─────────────────────────────────────── */
const OllamaOffline = ({
    status,
    ollamaUrl,
    onRetry,
}: {
    status: OllamaStatus;
    ollamaUrl: string;
    onRetry: () => void;
}) => (
    <div className="flex-1 flex items-center justify-center p-6 bg-[#0d0a1a]">
        {status === 'checking' ? (
            <div className="text-center">
                <div className="w-12 h-12 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mx-auto mb-5" />
                <p className="text-slate-400 text-sm font-medium">Connecting to Ollama…</p>
                <p className="text-slate-600 text-xs mt-1 font-mono">{ollamaUrl}</p>
            </div>
        ) : (
            <div className="max-w-sm w-full text-center">
                <div className="w-16 h-16 bg-amber-500/8 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl select-none">
                    🦙
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">Ollama Not Running</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-5 px-2">
                    Start Ollama on your machine to chat with local AI models.
                    Everything runs privately — your data never leaves your device.
                </p>

                {/* Terminal instructions */}
                <div className="bg-[#1a1535] border border-white/8 rounded-2xl p-4 mb-5 text-left space-y-3">
                    {[
                        { step: '1 · Start the server',      cmd: 'ollama serve',              color: 'text-emerald-400' },
                        { step: '2 · Allow cross-origin',    cmd: 'OLLAMA_ORIGINS=* ollama serve', color: 'text-amber-400' },
                        { step: '3 · Pull a model',          cmd: 'ollama pull qwen2.5',       color: 'text-emerald-400' },
                    ].map((item, i) => (
                        <div key={i} className={i > 0 ? 'border-t border-white/5 pt-3' : ''}>
                            <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-1.5">
                                {item.step}
                            </p>
                            <div className="flex items-center gap-2 font-mono text-sm">
                                <span className="text-slate-700 select-none">$</span>
                                <code className={item.color}>{item.cmd}</code>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={onRetry}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 rounded-xl transition-colors font-medium text-sm mb-3 touch-manipulation"
                >
                    <RefreshCw size={16} aria-hidden="true" />
                    Retry Connection
                </button>
                <p className="text-xs text-slate-600">
                    <span className="font-mono text-slate-500">{ollamaUrl}</span>
                    <span className="block mt-0.5">Auto-retrying every 5 s</span>
                </p>
            </div>
        )}
    </div>
);

/* ─── Main component ───────────────────────────────────────────────────────── */
const OllamaChatUI = () => {
    const {
        conversations,
        currentConversation,
        setCurrentConversation,
        messages,
        setMessages,
        createConversation,
        deleteConversation,
        saveMessage,
        updateConversationTitle,
    } = useChat();

    // Direct browser → Ollama client (no server proxy)
    const {
        ollamaUrl,
        setOllamaUrl,
        status: ollamaStatus,
        models,
        isLoadingModels,
        retry: retryOllama,
        streamChat,
    } = useOllama();

    const isMobile = useIsMobile(1024);

    const [selectedModel, setSelectedModel]     = useState('');
    const [input, setInput]                     = useState('');
    const [isStreaming, setIsStreaming]          = useState(false);
    const [ragEnabled, setRagEnabled]           = useState(false);
    const [showSettings, setShowSettings]       = useState(false);
    const [temperature, setTemperature]         = useState(0.7);
    const [systemPrompt, setSystemPrompt]       = useState('You are a helpful AI assistant.');
    const [error, setError]                     = useState<string | null>(null);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const messagesEndRef  = useRef<HTMLDivElement>(null);
    const streamContentRef = useRef('');
    const streamRafRef    = useRef<number | undefined>(undefined);
    const abortControllerRef = useRef<AbortController | null>(null);
    const messagesRef     = useRef(messages);
    messagesRef.current   = messages;

    // Auto-select first model when models load
    useEffect(() => {
        if (models.length > 0 && !selectedModel) {
            setSelectedModel(models[0].name);
        }
    }, [models, selectedModel]);

    // ── Send ────────────────────────────────────────────────────────────────
    const sendMessage = useCallback(async (userText: string) => {
        if (!selectedModel) { setError('Please select a model first'); return; }

        // Auto-create conversation on first message
        let conv = currentConversation;
        if (!conv) conv = createConversation();

        setIsStreaming(true);
        setError(null);
        streamContentRef.current = '';

        const now = new Date();
        const userMsg: MessageType = {
            id: `msg-${Date.now()}-u`,
            role: 'user',
            content: userText,
            createdAt: now,
            conversationId: conv.id,
        };

        // Persist user message
        saveMessage(userMsg);

        // Auto-title from the first message
        if (messagesRef.current.length === 0 && conv.title === 'New Chat') {
            const words = userText.trim().split(/\s+/).slice(0, 7).join(' ');
            updateConversationTitle(conv.id, words.length > 52 ? words.slice(0, 52) + '…' : words);
        }

        const assistantId = `msg-${Date.now()}-a`;
        const assistantPlaceholder: MessageType = {
            id: assistantId,
            role: 'assistant',
            content: '',
            createdAt: new Date(),
            conversationId: conv.id,
        };

        setMessages(prev => [...prev, userMsg, assistantPlaceholder]);

        const abort = new AbortController();
        abortControllerRef.current = abort;

        try {
            await streamChat(
                {
                    model: selectedModel,
                    messages: [...messagesRef.current, userMsg].map(m => ({
                        role: m.role as 'user' | 'assistant' | 'system',
                        content: m.content,
                    })),
                    systemPrompt,
                    temperature,
                },
                (token) => {
                    streamContentRef.current += token;
                    cancelAnimationFrame(streamRafRef.current!);
                    streamRafRef.current = requestAnimationFrame(() => {
                        setMessages(prev => {
                            const last = prev[prev.length - 1];
                            if (!last || last.id !== assistantId) return prev;
                            return [...prev.slice(0, -1), { ...last, content: streamContentRef.current }];
                        });
                    });
                },
                abort.signal,
            );

            // Flush final frame & persist
            cancelAnimationFrame(streamRafRef.current!);
            const finalContent = streamContentRef.current;
            const finalMsg: MessageType = { ...assistantPlaceholder, content: finalContent };
            saveMessage(finalMsg);
            setMessages(prev => {
                const last = prev[prev.length - 1];
                if (!last || last.id !== assistantId) return prev;
                return [...prev.slice(0, -1), { ...last, content: finalContent }];
            });
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                // User stopped — persist whatever was streamed
                if (streamContentRef.current) {
                    saveMessage({ ...assistantPlaceholder, content: streamContentRef.current });
                } else {
                    // Remove empty placeholder
                    setMessages(prev => prev.filter(m => m.id !== assistantId));
                }
            } else {
                setError(err instanceof Error ? err.message : 'Failed to send message');
                setMessages(prev => prev.filter(m => m.id !== assistantId));
            }
        } finally {
            abortControllerRef.current = null;
            setIsStreaming(false);
        }
    }, [selectedModel, currentConversation, temperature, systemPrompt, streamChat,
        createConversation, saveMessage, updateConversationTitle, setMessages]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || isStreaming) return;
        const msg = input;
        setInput('');
        await sendMessage(msg);
    }, [input, isStreaming, sendMessage]);

    const stopStreaming = useCallback(() => {
        abortControllerRef.current?.abort();
    }, []);

    const handleDeleteConversation = useCallback((id: string) => {
        if (!window.confirm('Delete this conversation?')) return;
        deleteConversation(id);
    }, [deleteConversation]);

    const isOffline = ollamaStatus !== 'connected';

    return (
        <div className="flex h-screen bg-[#0d0a1a] text-slate-100 overflow-hidden">
            {/* Sidebar */}
            <ConversationList
                conversations={conversations}
                currentConversation={currentConversation}
                onCreateConversation={() => createConversation()}
                onDeleteConversation={handleDeleteConversation}
                onSelectConversation={(conv) => setCurrentConversation(conv)}
                onShowSettings={() => { setShowSettings(true); setIsMobileSidebarOpen(false); }}
                isMobileSidebarOpen={isMobileSidebarOpen}
                onMobileSidebarToggle={() => setIsMobileSidebarOpen(prev => !prev)}
            />

            {/* Main area */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">

                {/* ── Header ── */}
                <header className="shrink-0 relative z-10 bg-[#130f28]/95 backdrop-blur-xl border-b border-white/6">
                    <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 h-14 sm:h-15 gap-2">

                        {/* Left: hamburger + conversation title */}
                        <div className="flex items-center gap-2 min-w-0">
                            {isMobile && (
                                <button
                                    onClick={() => setIsMobileSidebarOpen(true)}
                                    className="shrink-0 p-2 hover:bg-white/5 rounded-lg touch-manipulation"
                                    aria-label="Open sidebar"
                                >
                                    <Menu size={20} className="text-slate-400" />
                                </button>
                            )}
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-xl shrink-0 leading-none" aria-hidden="true">
                                    {selectedModel ? getModelIcon(selectedModel) : '🤖'}
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-[13px] sm:text-sm font-semibold text-white truncate max-w-35 sm:max-w-50 md:max-w-xs lg:max-w-sm leading-tight">
                                        {currentConversation?.title || 'New Conversation'}
                                    </h2>
                                    <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                                        {messages.length} message{messages.length !== 1 ? 's' : ''}
                                        {selectedModel && <> · <span className="text-slate-400">{selectedModel}</span></>}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right: error badge + RAG toggle + model picker */}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {error && (
                                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/25 rounded-lg max-w-50 lg:max-w-64">
                                    <AlertCircle size={13} className="text-red-400 shrink-0" />
                                    <span className="text-xs text-red-300 truncate">{error}</span>
                                </div>
                            )}

                            {/* RAG toggle */}
                            <button
                                type="button"
                                onClick={() => setRagEnabled(prev => !prev)}
                                aria-label={ragEnabled ? 'Disable RAG context' : 'Enable RAG context'}
                                aria-pressed={ragEnabled}
                                className={[
                                    'flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl border transition-colors touch-manipulation select-none text-xs font-medium',
                                    ragEnabled
                                        ? 'bg-violet-600/15 border-violet-500/30 text-violet-400'
                                        : 'bg-white/4 border-white/8 text-slate-500 hover:text-slate-300 hover:bg-white/6',
                                ].join(' ')}
                            >
                                <Search size={14} aria-hidden="true" />
                                <span className="hidden md:inline">RAG</span>
                            </button>

                            <ModelDropdown
                                models={models}
                                selectedModel={selectedModel}
                                onSelectModel={setSelectedModel}
                                isLoading={isLoadingModels}
                                onRefresh={() => retryOllama()}
                                isOllamaOffline={isOffline}
                            />
                        </div>
                    </div>
                </header>

                {/* Mobile error toast */}
                {error && isMobile && (
                    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#130f28] border border-red-500/30 rounded-xl px-4 py-3 shadow-xl max-w-[90vw] animate-slide-down">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={14} className="text-red-400 shrink-0" />
                            <span className="text-sm text-red-300 wrap-break-word">{error}</span>
                        </div>
                    </div>
                )}

                {/* Settings panel */}
                {showSettings && (
                    <SettingsPanel
                        temperature={temperature}
                        onTemperatureChange={setTemperature}
                        systemPrompt={systemPrompt}
                        onSystemPromptChange={setSystemPrompt}
                        ollamaUrl={ollamaUrl}
                        onOllamaUrlChange={setOllamaUrl}
                        ollamaStatus={ollamaStatus}
                        onClearHistory={() => {
                            if (window.confirm('Clear all chat history? This cannot be undone.')) {
                                chatHistory.clearAll();
                                window.location.reload();
                            }
                        }}
                        onClose={() => setShowSettings(false)}
                    />
                )}

                {/* Body */}
                {isOffline ? (
                    <OllamaOffline status={ollamaStatus} ollamaUrl={ollamaUrl} onRetry={retryOllama} />
                ) : (
                    <MessageList
                        messages={messages}
                        selectedModel={selectedModel}
                        messagesEndRef={messagesEndRef}
                        onSendPrompt={sendMessage}
                    />
                )}

                {/* Input */}
                <ChatInput
                    input={input}
                    onInputChange={setInput}
                    onSend={handleSend}
                    onStop={stopStreaming}
                    isStreaming={isStreaming}
                    selectedModel={selectedModel}
                    disabled={!selectedModel || isOffline}
                    isOllamaOffline={isOffline}
                />
            </div>
        </div>
    );
};

export default OllamaChatUI;
