import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ollama Chat UI — Local AI Assistant",
    template: "%s | Ollama Chat UI",
  },
  description:
    "A privacy-first, client-side chat interface for Ollama. Chat with local AI models like Llama, Qwen, DeepSeek and more — streaming responses, persistent history, zero data sent to any server.",
  keywords: [
    "ollama",
    "local AI",
    "chat UI",
    "privacy",
    "llama",
    "qwen",
    "deepseek",
    "self-hosted AI",
    "open source",
    "Next.js",
  ],
  authors: [{ name: "Ollama Chat UI" }],
  openGraph: {
    title: "Ollama Chat UI — Local AI Assistant",
    description:
      "Chat with local AI models via Ollama. Private, fast, no cloud — runs entirely on your machine.",
    type: "website",
    siteName: "Ollama Chat UI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ollama Chat UI — Local AI Assistant",
    description:
      "Chat with local AI models via Ollama. Private, fast, runs entirely on your machine.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
