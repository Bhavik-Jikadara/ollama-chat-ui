'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export type OllamaStatus = 'checking' | 'connected' | 'unavailable';

export interface OllamaModel {
    name: string;
    size?: string;
    description?: string;
}

export interface StreamChatOptions {
    model: string;
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    systemPrompt?: string;
    temperature?: number;
}

const RETRY_MS = 5000;
const URL_KEY = 'ollama_url';

function formatBytes(bytes: number): string {
    if (!bytes) return '';
    const gb = bytes / 1_073_741_824;
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${Math.round(bytes / 1_048_576)} MB`;
}

function normaliseUrl(raw: string): string {
    return raw.trim().replace(/\/$/, '') || 'http://localhost:11434';
}

export function useOllama() {
    const [ollamaUrl, setOllamaUrlState] = useState<string>(() =>
        typeof window !== 'undefined'
            ? normaliseUrl(localStorage.getItem(URL_KEY) || 'http://localhost:11434')
            : 'http://localhost:11434'
    );
    const [status, setStatus] = useState<OllamaStatus>('checking');
    const [models, setModels] = useState<OllamaModel[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

    // Fetch models directly from the user's local Ollama — no server proxy
    const checkAndLoad = useCallback(async (url?: string): Promise<boolean> => {
        const target = url ?? ollamaUrl;
        setIsLoadingModels(true);
        try {
            const res = await fetch(`${target}/api/tags`, {
                signal: AbortSignal.timeout(5000),
            });
            if (!res.ok) { setStatus('unavailable'); return false; }

            const data = await res.json() as {
                models?: Array<{
                    name: string;
                    size?: number;
                    details?: { family?: string; parameter_size?: string; quantization_level?: string };
                }>;
            };

            const list: OllamaModel[] = (data.models ?? []).map(m => ({
                name: m.name,
                size: m.details?.parameter_size ?? formatBytes(m.size ?? 0),
                description: [m.details?.family, m.details?.quantization_level]
                    .filter(Boolean).join(' · '),
            }));

            setModels(list);
            setStatus('connected');
            return true;
        } catch {
            setStatus('unavailable');
            return false;
        } finally {
            setIsLoadingModels(false);
        }
    }, [ollamaUrl]);

    // Initial probe
    useEffect(() => { checkAndLoad(); }, [checkAndLoad]);

    // Auto-retry every 5 s while unavailable; stop once connected
    useEffect(() => {
        if (status !== 'unavailable') { clearInterval(timerRef.current); return; }
        timerRef.current = setInterval(async () => {
            const ok = await checkAndLoad();
            if (ok) clearInterval(timerRef.current);
        }, RETRY_MS);
        return () => clearInterval(timerRef.current);
    }, [status, checkAndLoad]);

    const setOllamaUrl = useCallback((raw: string) => {
        const url = normaliseUrl(raw);
        setOllamaUrlState(url);
        localStorage.setItem(URL_KEY, url);
        setStatus('checking');
        checkAndLoad(url);
    }, [checkAndLoad]);

    // Stream chat tokens directly from the browser to localhost:11434
    const streamChat = useCallback(async (
        opts: StreamChatOptions,
        onToken: (token: string) => void,
        signal?: AbortSignal,
    ): Promise<void> => {
        const msgs = [
            ...(opts.systemPrompt ? [{ role: 'system' as const, content: opts.systemPrompt }] : []),
            ...opts.messages,
        ];

        const res = await fetch(`${ollamaUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: opts.model,
                messages: msgs,
                stream: true,
                options: { temperature: opts.temperature ?? 0.7 },
            }),
            signal,
        });

        if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response stream from Ollama');

        const decoder = new TextDecoder('utf-8', { fatal: false });
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
                if (!line.trim()) continue;
                try {
                    const json = JSON.parse(line) as { message?: { content?: string } };
                    if (json.message?.content) onToken(json.message.content);
                } catch { /* skip partial lines */ }
            }
        }
    }, [ollamaUrl]);

    return { ollamaUrl, setOllamaUrl, status, models, isLoadingModels, retry: checkAndLoad, streamChat };
}
