# Ollama Chat UI

A lightweight, fully client-side chat interface for [Ollama](https://ollama.com) that runs entirely in the browser. It features real-time streaming responses, automatic model detection, multi-conversation management, persistent local history, configurable settings, and responsive design—without requiring a server, database, login, or API keys.

Built with Next.js and React, it streams responses token-by-token from your local Ollama instance, saves conversation history to `localStorage`, and requires zero backend configuration to use.

---

## Features

- **Fully client-side** — the browser talks directly to Ollama; no server proxy, no middleman
- **Real-time streaming** — token-by-token responses via NDJSON, batched with `requestAnimationFrame` for smooth rendering
- **Auto model detection** — models load automatically from your running Ollama instance
- **Multi-conversation sidebar** — create, search, rename, and delete conversations; titles are generated automatically
- **Persistent history** — chat history survives page refreshes via `localStorage`
- **Stop mid-stream** — cancel any in-flight response at any time
- **Configurable Ollama URL** — point to any host (local or remote) from the Settings panel
- **System prompt & temperature** — per-session controls for response style and creativity
- **Fully responsive** — mobile drawer sidebar, desktop fixed layout
- **No login, no database, no API keys**

---

## Tech Stack

| Layer      | Technology                           |
| ---------- | ------------------------------------ |
| Framework  | Next.js 16 (App Router, Turbopack)   |
| UI         | React 19                             |
| Styling    | Tailwind CSS v4                      |
| Language   | TypeScript 5                         |
| Icons      | Lucide React                         |
| Storage    | Browser `localStorage`               |
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

### 3. Start Ollama

Running the UI on `localhost` in dev mode works without any extra config. If you deploy to a remote domain (e.g. Vercel), you need to allow that origin so the browser can reach Ollama:

```bash
# Allow all origins — simplest for a personal tool
OLLAMA_ORIGINS=* ollama serve

# Or allow only your deployed domain
OLLAMA_ORIGINS=https://your-app.vercel.app ollama serve
```

On **Windows**, set the variable before starting:

```powershell
$env:OLLAMA_ORIGINS = "*"
ollama serve
```

Or set it permanently in your user environment (no need to re-set on every restart):

```powershell
[System.Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "*", "User")
# Then relaunch Ollama
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

| Setting       | Description                                     | Default                           |
| ------------- | ----------------------------------------------- | --------------------------------- |
| Ollama URL    | Address of your Ollama instance                 | `http://localhost:11434`          |
| Temperature   | Response creativity (0 = precise, 2 = creative) | `0.7`                             |
| System Prompt | Instructions prepended to every conversation    | `You are a helpful AI assistant.` |

The Ollama URL is saved to `localStorage` and persists across sessions.

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

- **No server proxy** — Next.js only serves the static HTML/JS bundle. All AI traffic flows directly from the browser to the local Ollama instance.
- **localStorage** — chat history lives entirely on the client. Nothing is sent to any server.
- **Streaming** — Ollama's `/api/chat` returns NDJSON (one JSON object per line). The browser reads each chunk and updates the UI token-by-token, batched via `requestAnimationFrame` to avoid excess re-renders.
- **Auto-retry** — if Ollama is unreachable on load, the app polls every 5 seconds and reconnects automatically when Ollama comes back up.

---

## Deployment

Because all AI traffic is client-side, the UI can be deployed anywhere that serves a Next.js app — the server only delivers the HTML and JavaScript bundle.

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

After deploying to a domain, configure Ollama to accept requests from that origin:

```bash
OLLAMA_ORIGINS=https://your-deployed-domain.com ollama serve
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

1. Confirm Ollama is running: `ollama list`
2. Check the Ollama URL in Settings matches where Ollama is listening
3. If deployed to a remote domain, ensure `OLLAMA_ORIGINS` includes that domain and Ollama has been restarted

### CORS error in browser console

The browser is blocking requests from your deployed domain to your local Ollama. Fix:

```bash
# On macOS / Linux
OLLAMA_ORIGINS=* ollama serve

# On Windows (PowerShell)
$env:OLLAMA_ORIGINS = "*"; ollama serve
```

See [Step 3 of Prerequisites](#3-start-ollama) for setting this permanently on Windows.

### Slow first response

Large models (30B+) take time to load into memory. The first token may be delayed — subsequent responses in the same session are faster once the model is warm.

### Chat history missing after clearing browser data

History is stored in `localStorage`. Clearing browser storage removes it permanently. Use the **Clear Chat History** button in Settings for a clean in-app wipe.

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Commit your changes and open a pull request

---

## License

MIT — use it, fork it, self-host it.
