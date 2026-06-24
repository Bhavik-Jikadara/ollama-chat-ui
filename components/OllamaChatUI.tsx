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
    <div className="flex-1 flex items-center justify-center p-6 bg-gray-900">
        {status === 'checking' ? (
            <div className="text-center">
                <div className="w-14 h-14 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-5" />
                <p className="text-gray-400 text-sm">Connecting to Ollama…</p>
                <p className="text-gray-600 text-xs mt-1">{ollamaUrl}</p>
            </div>
        ) : (
            <div className="max-w-sm w-full text-center">
                <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl select-none">
                    🦙
                </div>
                <h2 className="text-xl font-bold mb-2">Ollama Not Running</h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">
                    Start Ollama on your machine to chat with local AI models.
                    Everything runs privately — your data never leaves your device.
                </p>

                {/* Terminal instructions */}
                <div className="bg-gray-800/80 border border-gray-700/50 rounded-xl p-4 mb-5 text-left space-y-3">
                    <div>
                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1.5">
                            1 · Start the server
                        </p>
                        <div className="flex items-center gap-2 font-mono text-sm">
                            <span className="text-gray-600 select-none">$</span>
                            <code className="text-emerald-400">ollama serve</code>
                        </div>
                    </div>
                    <div className="border-t border-gray-700/50 pt-3">
                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1.5">
                            2 · Allow this site (for remote access)
                        </p>
                        <div className="font-mono text-xs text-gray-400 space-y-1">
                            <p><span className="text-gray-600">$</span> <code className="text-amber-400">OLLAMA_ORIGINS=* ollama serve</code></p>
                        </div>
                    </div>
                    <div className="border-t border-gray-700/50 pt-3">
                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1.5">
                            3 · Pull a model
                        </p>
                        <div className="flex items-center gap-2 font-mono text-sm">
                            <span className="text-gray-600 select-none">$</span>
                            <code className="text-emerald-400">ollama pull qwen2.5</code>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onRetry}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all font-medium mb-3 touch-manipulation"
                >
                    <RefreshCw size={18} aria-hidden="true" />
                    Retry Connection
                </button>
                <p className="text-xs text-gray-600">
                    Connecting to: <span className="font-mono text-gray-500">{ollamaUrl}</span>
                    <br />Auto-retrying every 5 seconds
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
        <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
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
                <header className="shrink-0 relative z-10 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 shadow-lg">
                    <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 h-14 sm:h-16 md:h-17 gap-2">

                        {/* Left: hamburger + title */}
                        <div className="flex items-center gap-2 min-w-0">
                            {isMobile && (
                                <button
                                    onClick={() => setIsMobileSidebarOpen(true)}
                                    className="shrink-0 p-2.5 hover:bg-gray-800 rounded-lg touch-manipulation"
                                    aria-label="Open sidebar"
                                >
                                    <Menu size={22} />
                                </button>
                            )}
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xl sm:text-2xl shrink-0" aria-hidden="true">
                                    {selectedModel ? getModelIcon(selectedModel) : '🤖'}
                                </span>
                                <div className="min-w-0 hidden sm:block">
                                    <h2 className="text-sm sm:text-base font-semibold truncate max-w-35 sm:max-w-50 md:max-w-xs lg:max-w-sm">
                                        {currentConversation?.title || 'New Conversation'}
                                    </h2>
                                    <p className="text-xs text-gray-400 truncate">
                                        {messages.length} message{messages.length !== 1 ? 's' : ''}
                                        &nbsp;·&nbsp;{selectedModel || 'No model selected'}
                                    </p>
                                </div>
                                <div className="min-w-0 sm:hidden">
                                    <p className="text-sm font-medium truncate max-w-30">
                                        {currentConversation?.title || 'New Conversation'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right: error + RAG + model picker */}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {error && (
                                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-red-900/20 border border-red-700/50 rounded-lg max-w-50 lg:max-w-70">
                                    <AlertCircle size={14} className="text-red-400 shrink-0" />
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
                                    'flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg transition-all border touch-manipulation select-none',
                                    ragEnabled
                                        ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                                        : 'bg-gray-800/50 border-gray-700/50 text-gray-500 hover:bg-gray-800 hover:text-gray-300',
                                ].join(' ')}
                            >
                                <Search size={15} aria-hidden="true" />
                                <span className="text-xs font-medium hidden md:inline">RAG</span>
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
                    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-700 rounded-lg p-3 shadow-lg max-w-[90vw] animate-slide-down">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={16} className="text-red-400 shrink-0" />
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
