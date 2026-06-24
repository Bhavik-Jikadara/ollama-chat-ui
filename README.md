# Ollama Chat UI

A privacy-first, fully client-side chat interface for [Ollama](https://ollama.com). Chat with local AI models directly from your browser — your data never leaves your machine, no account required, no cloud calls.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- **Zero backend** — browser talks to Ollama directly, no server proxy needed
- **Real-time streaming** — token-by-token responses via NDJSON stream
- **Auto model detection** — models load automatically from your running Ollama instance
- **Persistent chat history** — conversations saved in `localStorage`, survive page refreshes
- **Multi-conversation** — sidebar with search, create, delete, and auto-titling
- **Stop streaming** — cancel any in-flight response mid-stream
- **Configurable Ollama URL** — point to any host from the Settings panel
- **Temperature & system prompt** — per-session controls
- **Fully responsive** — mobile drawer sidebar, desktop fixed layout
- **No login, no database, no API keys**

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16.1 (App Router, Turbopack) |
| UI | React 19 |
| Styling | Tailwind CSS v4 |
| Language | TypeScript 5 |
| Icons | Lucide React |
| Storage | Browser `localStorage` |
| AI Runtime | [Ollama](https://ollama.com) (local) |

---

## Prerequisites

### 1. Install Ollama

```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows — download the installer from https://ollama.com/download
```

### 2. Pull a model

```bash
ollama pull qwen2.5       # recommended — fast and capable
ollama pull llama3.2
ollama pull deepseek-r1
```

### 3. Start Ollama with CORS allowed

Running the UI on `localhost` in dev mode works without extra config. If you deploy to a domain (e.g. `https://chat.yourdomain.com`), you must allow that origin:

```bash
# Allow all origins — simplest for a personal tool
OLLAMA_ORIGINS=* ollama serve

# Or allow a specific domain only
OLLAMA_ORIGINS=https://chat.yourdomain.com ollama serve
```

On **Windows**, set the variable before serving:

```powershell
$env:OLLAMA_ORIGINS = "*"
ollama serve
```

---

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/your-username/ollama-chat-ui.git
cd ollama-chat-ui

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If Ollama is running, models appear automatically in the dropdown.

---

## Configuration

All settings live in the **Settings panel** (gear icon in the sidebar):

| Setting | Description | Default |
| --- | --- | --- |
| Ollama URL | Address of your Ollama server | `http://localhost:11434` |
| Temperature | Response creativity (0 = precise, 2 = creative) | `0.7` |
| System Prompt | Instructions prepended to every conversation | `You are a helpful AI assistant.` |

The Ollama URL is saved to `localStorage` and remembered across sessions.

---

## How It Works

```text
Browser  ──fetch──▶  Ollama (localhost:11434 or custom URL)
   │                          │
   │◀── NDJSON stream ────────┘
   │
localStorage
  ├── ollama_conversations   (list + metadata)
  ├── ollama_messages        (all messages, capped at 2000)
  └── ollama_url             (persisted Ollama URL)
```

- **No server proxy** — Next.js only serves the static HTML/JS bundle. All AI traffic goes directly from the user's browser to their Ollama instance.
- **localStorage** — chat history lives entirely on the client. Nothing is sent to any server.
- **Streaming** — Ollama's `/api/chat` returns NDJSON (one JSON object per line). The browser reads each chunk and updates the UI token-by-token, batched via `requestAnimationFrame` to avoid excess re-renders.
- **Auto-retry** — if Ollama is unavailable on load, the app retries every 5 seconds and reconnects automatically.

---

## Deployment

Because all AI traffic is client-side, deploy anywhere that serves static files or runs Node.js.

### Vercel (recommended)

```bash
npm i -g vercel
vercel
```

### Self-hosted (Node.js)

```bash
npm run build
npm start        # Next.js production server on port 3000
```

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

After deploying to a domain, tell Ollama to allow that origin so browser requests aren't blocked by CORS:

```bash
OLLAMA_ORIGINS=https://your-deployed-domain.com ollama serve
```

---

## Project Structure

```text
ollama-chat-ui/
├── app/
│   ├── layout.tsx            # Root layout + SEO metadata
│   ├── page.tsx              # Entry point — renders OllamaChatUI
│   └── globals.css           # Tailwind base styles
├── components/
│   ├── OllamaChatUI.tsx      # Root component, orchestrates all state
│   ├── ConversationList.tsx  # Sidebar — conversations, search, new chat
│   ├── MessageList.tsx       # Chat bubbles + empty state
│   ├── ChatInput.tsx         # Textarea, send/stop, quick prompts
│   ├── ModelDropdown.tsx     # Model picker with live search
│   └── SettingsPanel.tsx     # Temperature, system prompt, Ollama URL
├── hooks/
│   ├── useOllama.ts          # Ollama connection, model fetch, streaming
│   ├── useChat.ts            # Conversation + message state (localStorage)
│   ├── useIsMobile.ts        # Responsive breakpoint detection
│   └── useClickOutside.ts    # Close-on-outside-click utility
├── lib/
│   ├── chat-history.ts       # localStorage CRUD for conversations + messages
│   └── model-utils.ts        # Model name → emoji icon mapping
└── types/
    └── types.ts              # Shared TypeScript interfaces
```

---

## Scripts

```bash
npm run dev      # Development server with Turbopack hot reload
npm run build    # Production build (includes TypeScript check)
npm run start    # Start production server
npm run lint     # ESLint
```

---

## Troubleshooting

### Models not loading / "No models found"

- Confirm Ollama is running: `ollama list`
- Check the Ollama URL in Settings matches where Ollama is listening
- If deployed to a domain, ensure `OLLAMA_ORIGINS` includes that domain

### CORS error in browser console

- Start Ollama with `OLLAMA_ORIGINS=*` or set it to your specific domain

### Slow first response

- Large models (30B+) take time to load into VRAM. The first token may be delayed — subsequent responses in the same session are faster.

### Chat history missing after clearing browser data

- History lives in `localStorage`. Clearing browser storage removes it permanently. Use the "Clear Chat History" button in Settings for an in-app wipe.

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Commit your changes and open a pull request

---

## License

MIT — use it, fork it, self-host it.
