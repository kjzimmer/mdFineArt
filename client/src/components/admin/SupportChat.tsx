import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../../lib/apiFetch';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [logged, setLogged] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load history on first open
  useEffect(() => {
    if (!open || loaded) return;
    apiFetch<Message[]>('/api/support/history')
      .then((msgs) => {
        setMessages(msgs);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [open, loaded]);

  // Scroll to bottom when messages change or panel opens
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const optimistic: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    setSending(true);
    setLogged(false);

    try {
      const res = await apiFetch<{ message: string; logged: boolean }>('/api/support/chat', {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.message }]);
      if (res.logged) setLogged(true);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I couldn't reach the server. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const isEmpty = loaded && messages.length === 0;

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-accent shadow-lg transition hover:bg-accentHover"
        aria-label="Platform support"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-bg">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-bg">
            <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 0 0 1.28.53l3.58-3.579a.78.78 0 0 1 .527-.224 41.202 41.202 0 0 0 5.183-.5c1.437-.232 2.43-1.49 2.43-2.903V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0 0 10 2Zm0 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM8 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm5 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed right-6 z-50 flex w-[360px] flex-col rounded-2xl border border-border bg-bg shadow-2xl"
          style={{ bottom: '80px', maxHeight: 'calc(100vh - 120px)', height: '520px' }}>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-text">Platform Support</p>
              <p className="text-xs text-text/40">Ask anything · Share ideas · Report issues</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {!loaded && (
              <div className="flex justify-center pt-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            )}

            {isEmpty && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                <p className="text-sm text-text/60">
                  Hi! I know this platform inside and out. Ask me how to do something, tell me what's not working, or share an idea.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={msg.id ?? i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-accent text-bg rounded-br-sm'
                    : 'bg-surface border border-border text-text rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-text/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-text/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-text/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {logged && !sending && (
              <p className="text-center text-xs text-text/40">✓ Logged for Karl's review</p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Message…"
                rows={1}
                disabled={sending}
                className="flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text/30 outline-none focus:border-accent disabled:opacity-50"
                style={{ maxHeight: '120px', overflowY: 'auto' }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                }}
              />
              <button
                type="button"
                onClick={send}
                disabled={!input.trim() || sending}
                className="shrink-0 rounded-xl bg-accent px-3 py-2.5 text-bg transition hover:bg-accentHover disabled:opacity-40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                  <path d="M2.87 2.298a.75.75 0 0 0-.812 1.021L3.39 6.624a1 1 0 0 0 .928.626H8.25a.75.75 0 0 1 0 1.5H4.318a1 1 0 0 0-.927.626l-1.333 3.305a.75.75 0 0 0 .811 1.022l11.5-4.25a.75.75 0 0 0 0-1.4l-11.5-4.25Z" />
                </svg>
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-text/20">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </>
  );
}
