export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: Date;
    conversationId: string;
}

export interface Conversation {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    messageCount?: number;
}

export interface Model {
    name: string;
    size?: string;
    description?: string;
}
