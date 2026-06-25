'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, Conversation } from '@/types/types';
import { chatHistory, StoredConversation, StoredMessage } from '@/lib/chat-history';

// ── Adapters between stored (ISO strings) and runtime (Date objects) ──────────

function toConversation(s: StoredConversation): Conversation {
    return {
        id: s.id,
        title: s.title,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
        messageCount: s.messageCount,
    };
}

function toStoredMessage(m: Message): StoredMessage {
    return {
        id: m.id,
        conversationId: m.conversationId,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        createdAt: m.createdAt.toISOString(),
    };
}

function fromStoredMessage(s: StoredMessage): Message {
    return {
        id: s.id,
        conversationId: s.conversationId,
        role: s.role,
        content: s.content,
        createdAt: new Date(s.createdAt),
    };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useChat = () => {
    const [conversations, setConversations]           = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [messages, setMessages]                     = useState<Message[]>([]);
    const initializedRef = useRef(false);

    // Load conversation list on mount
    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;
        const stored = chatHistory.getConversations();
        const convs  = stored.map(toConversation);
        setConversations(convs);
        if (convs.length > 0) setCurrentConversation(convs[0]);
    }, []);

    // Reload messages whenever the active conversation changes
    useEffect(() => {
        if (!currentConversation) { setMessages([]); return; }
        setMessages(chatHistory.getMessages(currentConversation.id).map(fromStoredMessage));
    }, [currentConversation?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const createConversation = useCallback((title = 'New Chat', model?: string): Conversation => {
        const now  = new Date().toISOString();
        const stored: StoredConversation = {
            id: `conv-${Date.now()}`,
            title,
            model,
            messageCount: 0,
            createdAt: now,
            updatedAt: now,
        };
        chatHistory.upsertConversation(stored);
        const conv = toConversation(stored);
        setConversations(prev => [conv, ...prev]);
        setCurrentConversation(conv);
        setMessages([]);
        return conv;
    }, []);

    const deleteConversation = useCallback((id: string) => {
        chatHistory.deleteConversation(id);
        setConversations(prev => prev.filter(c => c.id !== id));
        setCurrentConversation(prev => {
            if (prev?.id !== id) return prev;
            const remaining = chatHistory.getConversations();
            return remaining.length > 0 ? toConversation(remaining[0]) : null;
        });
    }, []);

    // Persist a single message to localStorage (call once per message, not during streaming)
    const saveMessage = useCallback((msg: Message) => {
        chatHistory.appendMessage(toStoredMessage(msg));
    }, []);

    const updateConversationTitle = useCallback((id: string, title: string) => {
        chatHistory.updateTitle(id, title);
        setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
        setCurrentConversation(prev => prev?.id === id ? { ...prev, title } : prev);
    }, []);

    return {
        conversations,
        currentConversation,
        setCurrentConversation,
        messages,
        setMessages,
        createConversation,
        deleteConversation,
        saveMessage,
        updateConversationTitle,
    };
};
