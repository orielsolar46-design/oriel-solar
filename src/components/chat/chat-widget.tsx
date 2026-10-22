'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, RotateCcw, Send, UserRound, X } from 'lucide-react';
import { WhatsAppBadge, WhatsAppIcon } from '@/components/ui/brand-icons';
import { Button } from '@/components/ui/button';
import { CONTACT } from '@/lib/navigation';

type ChatProduct = {
  slug: string;
  name: string;
  brand: string;
  price: number | null;
  image: string | null;
  href: string;
};

type StoredMessage = {
  id: string;
  role: 'user' | 'assistant' | 'agent' | 'system';
  content: string;
  at: string;
  author?: string;
};

type ChatStatus = 'bot' | 'human' | 'closed';

const SUGGESTIONS = [
  'How much for a 5kW system?',
  'Do you deliver to Mombasa?',
  'Which Bluetti home battery?',
  'Do you install?',
];

const VISITOR_KEY = 'oriel-visitor-id';
const CHAT_KEY = 'oriel-chat-id';
const POLL_MS = 4000;

function readVisitorId(): string {
  try {
    const stored = window.localStorage.getItem(VISITOR_KEY);
    if (stored && /^[a-zA-Z0-9-]{8,64}$/.test(stored)) return stored;
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function mergeMessages(current: StoredMessage[], incoming: StoredMessage[]): StoredMessage[] {
  const seen = new Set(current.map((message) => message.id));
  const merged = [...current];
  for (const message of incoming) {
    if (!seen.has(message.id)) {
      seen.add(message.id);
      merged.push(message);
    }
  }
  return merged.sort((a, b) => a.at.localeCompare(b.at));
}

function clock(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Baraka, the assistant on the shopfront.
 *
 * He sits on the right, opposite the basket on the left of the header, and
 * opens into a real conversation: every exchange is stored, the shop can read
 * it, and a staff member can take over mid-chat. The widget polls while open,
 * so a human reply arrives without the visitor doing anything.
 *
 * The WhatsApp escape hatch is inside the panel, not only in the footer,
 * because some questions are better answered by a person straight away.
 */
export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [visitorId, setVisitorId] = React.useState('');
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<ChatStatus>('bot');
  const [messages, setMessages] = React.useState<StoredMessage[]>([]);
  const [products, setProducts] = React.useState<Record<string, ChatProduct[]>>({});
  const [input, setInput] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const pollTimer = React.useRef<number | null>(null);

  /* Identity + restore ------------------------------------------------ */

  React.useEffect(() => {
    const id = readVisitorId();
    setVisitorId(id);
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(CHAT_KEY);
    } catch {
      stored = null;
    }
    if (!stored) {
      setReady(true);
      return;
    }
    let cancelled = false;
    fetch(`/api/chat/session?visitorId=${encodeURIComponent(id)}&conversationId=${encodeURIComponent(stored)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { conversationId: string | null; status: ChatStatus; messages: StoredMessage[] } | null) => {
        if (cancelled) return;
        if (data?.conversationId) {
          setConversationId(data.conversationId);
          setStatus(data.status);
          setMessages(data.messages ?? []);
        } else {
          try {
            window.localStorage.removeItem(CHAT_KEY);
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTop = messages.length === 0 ? 0 : list.scrollHeight;
  }, [messages, pending, open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  /* Polling ----------------------------------------------------------- */

  const lastAt = messages.length > 0 ? messages[messages.length - 1].at : '';

  React.useEffect(() => {
    if (!open || !conversationId || !visitorId || status === 'closed' || pending) {
      return;
    }
    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch(
          `/api/chat/poll?visitorId=${encodeURIComponent(visitorId)}&conversationId=${encodeURIComponent(
            conversationId
          )}&after=${encodeURIComponent(lastAt)}`,
          { cache: 'no-store' }
        );
        if (response.ok) {
          const data = (await response.json()) as {
            status: ChatStatus;
            messages: StoredMessage[];
          };
          if (!cancelled) {
            setStatus(data.status);
            if (data.messages.length > 0) {
              setMessages((current) => mergeMessages(current, data.messages));
            }
          }
        }
      } catch {
        /* a missed poll is not an error worth showing */
      }
      if (!cancelled) {
        pollTimer.current = window.setTimeout(poll, POLL_MS);
      }
    };

    pollTimer.current = window.setTimeout(poll, POLL_MS);

    return () => {
      cancelled = true;
      if (pollTimer.current) window.clearTimeout(pollTimer.current);
    };
  }, [open, conversationId, visitorId, status, pending, lastAt]);

  /* Send -------------------------------------------------------------- */

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || pending || !visitorId || status === 'closed') return;

    const temporary: StoredMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: question,
      at: new Date().toISOString(),
    };

    setMessages((current) => [...current, temporary]);
    setInput('');
    setPending(true);
    setNotice(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          conversationId: conversationId ?? undefined,
          message: question,
          page: window.location.pathname,
        }),
      });

      const data = (await response.json()) as {
        conversationId?: string;
        status?: ChatStatus;
        messages?: StoredMessage[];
        reply?: string | null;
        products?: ChatProduct[];
        error?: string;
      };

      if (!response.ok || !data.messages) {
        setMessages((current) => current.filter((message) => message.id !== temporary.id));
        setNotice(data.error ?? 'Baraka could not answer just now. Please try again.');
        return;
      }

      setConversationId(data.conversationId ?? null);
      setStatus(data.status ?? 'bot');
      setMessages(data.messages);

      if (data.conversationId) {
        try {
          window.localStorage.setItem(CHAT_KEY, data.conversationId);
        } catch {
          /* ignore */
        }
      }

      if (data.products && data.products.length > 0) {
        const replyMessage = [...data.messages]
          .reverse()
          .find((message) => message.role === 'assistant');
        if (replyMessage) {
          setProducts((current) => ({ ...current, [replyMessage.id]: data.products ?? [] }));
        }
      }
    } catch {
      setMessages((current) => current.filter((message) => message.id !== temporary.id));
      setNotice('I could not reach Baraka just now. Please try again in a moment.');
    } finally {
      setPending(false);
    }
  };

  const startNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setProducts({});
    setStatus('bot');
    setNotice(null);
    try {
      window.localStorage.removeItem(CHAT_KEY);
    } catch {
      /* ignore */
    }
    inputRef.current?.focus();
  };

  const subtitle =
    status === 'human'
      ? 'Oriel team · you are chatting with a person'
      : status === 'closed'
        ? 'Chat closed'
        : 'Sales · Oriel Solar';

  // The back office has its own Chats screen and a bottom bar of its own; a
  // storefront widget floating over it would cover the More button and offer
  // visitors' chrome to staff. It is a shopfront instrument, so it stays there.
  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close chat"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] bg-oriel-navy-ink/40 sm:hidden"
        />
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Chat with Baraka from Oriel Solar"
          className="group fixed bottom-4 right-4 z-[70] flex h-14 w-14 items-center justify-center rounded-pill border border-oriel-green/30 bg-oriel-white shadow-[0_6px_20px_rgba(10,23,51,0.28)] transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oriel-orange focus-visible:ring-offset-2"
        >
          <span className="absolute inset-0 -z-10 animate-ping rounded-pill bg-oriel-green/20" />
          <WhatsAppBadge size={40} title="" />
          <span className="absolute -right-1.5 -top-1.5 rounded-pill bg-oriel-navy px-1.5 py-0.5 font-mono text-[0.5rem] font-semibold uppercase tracking-wide text-oriel-white">
            Baraka
          </span>
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label="Chat with Baraka"
          className="fixed inset-x-0 bottom-0 z-[70] flex h-[80vh] flex-col overflow-hidden rounded-t-card border border-oriel-line bg-oriel-white shadow-oriel-lift sm:bottom-24 sm:left-auto sm:right-4 sm:h-[37rem] sm:max-h-[calc(100vh-8rem)] sm:w-[23rem] sm:rounded-card"
        >
          <header className="flex items-center gap-3 bg-oriel-navy px-4 py-3 text-oriel-white">
            <span className="relative shrink-0">
              <WhatsAppBadge size={36} title="" />
              <span
                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-pill border-2 border-oriel-navy bg-oriel-green"
                aria-hidden
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-small font-semibold leading-tight">
                Baraka{' '}
                <span className="font-normal text-oriel-white/60">· Oriel Solar</span>
              </p>
              <p className="truncate text-micro text-oriel-white/70">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input text-oriel-white/80 transition-colors hover:bg-white/10"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </header>

          <div
            ref={listRef}
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto bg-oriel-mist px-4 py-4"
          >
            {!ready && (
              <p className="text-micro text-oriel-slate">Opening the conversation…</p>
            )}

            {ready && messages.length === 0 && (
              <div className="rounded-card border border-oriel-line bg-oriel-white p-4">
                <p className="font-mono text-micro font-semibold uppercase tracking-[0.16em] text-oriel-orange">
                  Start a chat
                </p>
                <p className="mt-1.5 font-display text-body-lg font-semibold leading-snug text-oriel-navy">
                  Hi, I&apos;m Baraka.
                </p>
                <p className="mt-1 text-small text-oriel-navy-ink">
                  Oriel Solar sales. Tell me what you want to power, or ask about a price,
                  delivery or installation.
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => send(s)}
                        className="inline-flex h-9 items-center rounded-pill border border-oriel-line bg-oriel-white px-3 text-micro font-medium text-oriel-navy transition-colors hover:border-oriel-orange hover:text-oriel-orange"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant="whatsapp-solid"
                  size="sm"
                  className="mt-4 w-full"
                >
                  <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon size={16} />
                    Chat with a person on WhatsApp
                  </a>
                </Button>
              </div>
            )}

            {messages.map((message) => {
              if (message.role === 'system') {
                return (
                  <p key={message.id} className="text-center text-[0.6875rem] text-oriel-slate">
                    {message.content}
                  </p>
                );
              }

              const isUser = message.role === 'user';
              const isAgent = message.role === 'agent';
              const cards = products[message.id] ?? [];

              return (
                <div key={message.id} className="space-y-2">
                  {isAgent && (
                    <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-oriel-green-deep">
                      <UserRound size={12} />
                      {message.author ?? 'Oriel team'}
                    </p>
                  )}
                  <div
                    className={
                      isUser
                        ? 'ml-auto max-w-[86%] rounded-card rounded-br-sm bg-oriel-navy px-3.5 py-2.5 text-small text-oriel-white'
                        : isAgent
                          ? 'max-w-[92%] rounded-card rounded-bl-sm border border-oriel-green/30 bg-oriel-green-soft px-3.5 py-2.5 text-small text-oriel-navy-ink'
                          : 'max-w-[92%] rounded-card rounded-bl-sm border border-oriel-line bg-oriel-white px-3.5 py-2.5 text-small text-oriel-navy-ink'
                    }
                  >
                    {message.content.split('\n').map((line, index) =>
                      line.trim() === '' ? (
                        <span key={index} className="block h-2" aria-hidden />
                      ) : (
                        <p key={index} className="whitespace-pre-wrap">
                          {line}
                        </p>
                      )
                    )}
                    <p
                      className={cnClock(
                        isUser ? 'text-oriel-white/45' : 'text-oriel-slate/70'
                      )}
                    >
                      {clock(message.at)}
                    </p>
                  </div>

                  {cards.length > 0 && (
                    <ul className="space-y-2">
                      {cards.slice(0, 3).map((product) => (
                        <li key={product.slug}>
                          <Link
                            href={product.href}
                            className="flex items-center gap-3 rounded-card border border-oriel-line bg-oriel-white p-2 transition-colors hover:border-oriel-orange"
                          >
                            {product.image ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={product.image}
                                alt=""
                                loading="lazy"
                                className="h-11 w-11 shrink-0 rounded-input bg-oriel-white object-contain p-1"
                              />
                            ) : (
                              <span className="h-11 w-11 shrink-0 rounded-input bg-oriel-mist" />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-micro font-semibold text-oriel-navy">
                                {product.name}
                              </span>
                              <span className="block font-mono text-micro text-oriel-slate">
                                {product.price != null
                                  ? `KES ${product.price.toLocaleString('en-KE')}`
                                  : 'Price on request'}
                              </span>
                            </span>
                            <ArrowRight
                              size={15}
                              strokeWidth={2}
                              className="shrink-0 text-oriel-orange"
                              aria-hidden
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}

            {pending && (
              <div className="max-w-[92%] rounded-card rounded-bl-sm border border-oriel-line bg-oriel-white px-3.5 py-3">
                <span className="flex gap-1" aria-label="Baraka is typing">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-bounce rounded-pill bg-oriel-slate"
                      style={{ animationDelay: `${i * 160}ms` }}
                    />
                  ))}
                </span>
              </div>
            )}

            {status === 'closed' && (
              <div className="rounded-card border border-oriel-line bg-oriel-white p-3 text-center">
                <p className="text-micro text-oriel-slate">
                  This chat was closed by Oriel team.
                </p>
                <Button variant="outline" size="sm" className="mt-2" onClick={startNewChat}>
                  <RotateCcw size={14} aria-hidden /> Start a new chat
                </Button>
              </div>
            )}

            {notice && (
              <p className="rounded-input bg-oriel-orange-soft px-3 py-2 text-micro text-oriel-orange-deep">
                {notice}
              </p>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-oriel-line bg-oriel-white px-3 py-2.5"
          >
            <label htmlFor="chat-input" className="sr-only">
              Ask Baraka
            </label>
            <input
              ref={inputRef}
              id="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={status === 'closed' ? 'This chat is closed' : 'Ask Baraka anything…'}
              maxLength={1000}
              disabled={status === 'closed'}
              className="h-11 w-full rounded-input border border-oriel-line px-3 text-small text-oriel-navy-ink placeholder:text-oriel-slate focus:border-oriel-navy focus:outline-none disabled:bg-oriel-mist"
            />
            <Button type="submit" size="icon" disabled={pending || status === 'closed' || input.trim().length === 0}>
              <Send size={17} strokeWidth={1.75} aria-hidden />
              <span className="sr-only">Send</span>
            </Button>
          </form>

          <p className="border-t border-oriel-line bg-oriel-mist px-3 py-2 text-micro text-oriel-slate">
            {status === 'human' ? (
              <>
                You are chatting with a person from Oriel. You can still{' '}
                <a
                  href={CONTACT.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-oriel-green-deep underline underline-offset-2 hover:text-oriel-orange"
                >
                  open WhatsApp
                </a>
                .
              </>
            ) : (
              <>
                Baraka handles our sales enquiries. Need a person?{' '}
                <a
                  href={CONTACT.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-oriel-green-deep underline underline-offset-2 hover:text-oriel-orange"
                >
                  Chat with a person on WhatsApp
                </a>
              </>
            )}
          </p>
        </section>
      )}
    </>
  );
}

function cnClock(color: string): string {
  return `mt-1 text-right font-mono text-[0.5625rem] leading-none ${color}`;
}
