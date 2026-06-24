// localStorage-based chat history — works on any domain without a database

export interface StoredConversation {
    id: string;
    title: string;
    model?: string;
    messageCount: number;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
}

export interface StoredMessage {
    id: string;
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string; // ISO string
}

const CONV_KEY = 'ollama_conversations';
const MSG_KEY  = 'ollama_messages';
const MAX_MSGS = 2000;

function read<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch { return fallback; }
}

function write(key: string, value: unknown): void {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full */ }
}

export const chatHistory = {
    getConversations(): StoredConversation[] {
        return read<StoredConversation[]>(CONV_KEY, []);
    },

    upsertConversation(conv: StoredConversation): void {
        const all = this.getConversations();
        const idx = all.findIndex(c => c.id === conv.id);
        if (idx >= 0) all[idx] = { ...all[idx], ...conv };
        else all.unshift(conv);
        write(CONV_KEY, all);
    },

    deleteConversation(id: string): void {
        write(CONV_KEY, this.getConversations().filter(c => c.id !== id));
        write(MSG_KEY, read<StoredMessage[]>(MSG_KEY, []).filter(m => m.conversationId !== id));
    },

    updateTitle(id: string, title: string): void {
        const all = this.getConversations();
        const conv = all.find(c => c.id === id);
        if (!conv) return;
        conv.title = title;
        conv.updatedAt = new Date().toISOString();
        write(CONV_KEY, all);
    },

    getMessages(conversationId: string): StoredMessage[] {
        return read<StoredMessage[]>(MSG_KEY, []).filter(m => m.conversationId === conversationId);
    },

    appendMessage(msg: StoredMessage): void {
        const all = read<StoredMessage[]>(MSG_KEY, []);
        all.push(msg);
        write(MSG_KEY, all.length > MAX_MSGS ? all.slice(-MAX_MSGS) : all);

        // bump conversation updatedAt + messageCount
        const convs = this.getConversations();
        const conv  = convs.find(c => c.id === msg.conversationId);
        if (conv) {
            conv.updatedAt = msg.createdAt;
            conv.messageCount = (conv.messageCount ?? 0) + 1;
            write(CONV_KEY, convs);
        }
    },

    clearAll(): void {
        localStorage.removeItem(CONV_KEY);
        localStorage.removeItem(MSG_KEY);
    },
};
