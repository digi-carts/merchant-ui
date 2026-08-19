'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '@/lib/api';
import { Button } from './button';
import { Input } from './input';
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';

interface Msg { role: 'user' | 'model'; text: string }

interface AiChatProps {
  context: string;
  /** On settings pages pass true so it falls back to the platform Gemini key if merchant has none */
  fallbackToPlatform?: boolean;
}

export function AiChat({ context, fallbackToPlatform = false }: Readonly<AiChatProps>) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [available, setAvailable] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check whether any AI key is usable: merchant's own key, or platform key (only on settings pages)
    api.get('/store/ai-settings')
      .then(r => {
        const d = r.data as { ownKey?: boolean; platformProvided?: boolean };
        const ok = d.ownKey || (fallbackToPlatform && !!d.platformProvided);
        setAvailable(ok);
      })
      .catch(() => setAvailable(false));
  }, [fallbackToPlatform]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (messages.length === 0) {
        setMessages([{ role: 'model', text: `Hi! I'm your assistant. I can help you with this page, explain settings, or guide you through any task. What do you need help with?` }]);
      }
    }
  }, [open, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setError('');
    const updated: Msg[] = [...messages, { role: 'user', text }];
    setMessages(updated);
    setLoading(true);
    try {
      const r = await api.post('/store/ai-chat', {
        messages: updated,
        context,
        fallbackToPlatform,
      });
      setMessages(prev => [...prev, { role: 'model', text: (r.data as { text: string }).text }]);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (available === false) return null;

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-black text-white shadow-xl flex items-center justify-center hover:bg-neutral-800 active:scale-95 transition-all"
        aria-label="Open AI assistant"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-22 right-6 z-50 w-80 sm:w-96 max-h-[520px] flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-black text-white">
            <Bot size={16} />
            <span className="text-sm font-semibold flex-1">AI Assistant</span>
            <button type="button" onClick={() => setOpen(false)} className="opacity-70 hover:opacity-100">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-black text-white rounded-br-sm whitespace-pre-wrap'
                    : 'bg-neutral-100 text-neutral-900 rounded-bl-sm prose prose-sm prose-neutral max-w-none'
                }`}>
                  {m.role === 'user' ? m.text : <ReactMarkdown>{m.text}</ReactMarkdown>}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 rounded-2xl rounded-bl-sm px-3 py-2">
                  <Loader2 size={14} className="animate-spin text-neutral-400" />
                </div>
              </div>
            )}
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t px-3 py-2 flex gap-2 items-center bg-white">
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
              placeholder="Ask anything…"
              className="h-8 text-sm flex-1 border-neutral-200"
              disabled={loading}
            />
            <Button
              type="button"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              onClick={() => void send()}
              disabled={loading || !input.trim()}
            >
              <Send size={13} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
