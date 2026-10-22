'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Send, X } from 'lucide-react';
import { WhatsAppBadge } from '@/components/ui/brand-icons';
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

type Message = {
  role: 'user' | 'assistant';
  content: string;
  products?: ChatProduct[];
};

const SUGGESTIONS = [
  'How much for a 5kW system?',
  'Do you deliver to Mombasa?',
  'Which Bluetti home battery?',
  'Do you install?',
];

/**
 * The store assistant.
 *
 * It sits on the left of every page, out of the way of the cart on the right,
 * and opens into a chat that answers straight away — with the real catalogue
 * behind it, so the prices it quotes are the prices on the site.
 *
 * It is an assistant, not a person, and says so. The way to reach a human is
 * one tap away in the footer of the panel.
 */
export function ChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  React.useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, pending]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || pending) return;

    const history: Message[] = [...messages, { role: 'user', content: question }];
    setMessages(history);
    setInput('');
    setPending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = (await response.json()) as {
        reply?: string;
        products?: ChatProduct[];
        error?: string;
      };
      if (data.reply) {
        setMessages([...history, { role: 'assistant', content: data.reply, products: data.products }]);
      } else {
        setMessages([
          ...history,
          {
            role: 'assistant',
            content:
              data.error ??
              'I could not answer that just now. Please try again, or message us on WhatsApp.',
          },
        ]);
      }
    } catch {
      setMessages([
        ...history,
        {
          role: 'assistant',
          content: 'I could not reach the assistant just now. Please try again in a moment.',
        },
      ]);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close the assistant"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] bg-oriel-navy-ink/40 sm:hidden"
        />
      )}

      {/* The launcher, on the left so it never fights the basket on the right. */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Chat with the Oriel Solar assistant"
          className="group fixed bottom-4 left-4 z-[70] flex h-14 w-14 items-center justify-center rounded-pill border border-oriel-green/30 bg-oriel-white shadow-[0_6px_20px_rgba(10,23,51,0.28)] transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oriel-orange focus-visible:ring-offset-2"
        >
          <span className="absolute inset-0 -z-10 animate-ping rounded-pill bg-oriel-green/20" />
          <WhatsAppBadge size={40} title="" />
          <span className="absolute -right-1 -top-1 rounded-pill bg-oriel-navy px-1.5 py-0.5 font-mono text-[0.5625rem] font-semibold uppercase tracking-wider text-oriel-white">
            AI
          </span>
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label="Oriel Solar assistant"
          className="fixed inset-x-0 bottom-0 z-[70] flex h-[78vh] flex-col overflow-hidden rounded-t-card border border-oriel-line bg-oriel-white shadow-oriel-lift sm:bottom-24 sm:left-4 sm:right-auto sm:h-[32rem] sm:w-[22rem] sm:rounded-card"
        >
          <header className="flex items-center gap-3 bg-oriel-navy px-4 py-3 text-oriel-white">
            <WhatsAppBadge size={34} title="" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-small font-semibold leading-tight">Oriel Solar Assistant</p>
              <p className="text-micro text-oriel-white/70">AI · answers instantly</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close the assistant"
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
            {messages.length === 0 && (
              <div className="rounded-card border border-oriel-line bg-oriel-white p-4">
                <p className="text-small text-oriel-navy-ink">
                  Hello, and welcome to Oriel Solar. Ask me about panels, batteries,
                  inverters, lighting, delivery or a price, and I will answer from our
                  live catalogue.
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
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className="space-y-2">
                <div
                  className={
                    message.role === 'user'
                      ? 'ml-auto max-w-[85%] rounded-card rounded-br-sm bg-oriel-navy px-3.5 py-2.5 text-small text-oriel-white'
                      : 'max-w-[92%] rounded-card rounded-bl-sm border border-oriel-line bg-oriel-white px-3.5 py-2.5 text-small text-oriel-navy-ink'
                  }
                >
                  {message.content.split('\n').map((line, lineIndex) =>
                    line.trim() === '' ? (
                      <span key={lineIndex} className="block h-2" aria-hidden />
                    ) : (
                      <p key={lineIndex} className="whitespace-pre-wrap">
                        {line}
                      </p>
                    )
                  )}
                </div>

                {message.products && message.products.length > 0 && (
                  <ul className="space-y-2">
                    {message.products.slice(0, 3).map((product) => (
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
            ))}

            {pending && (
              <div className="max-w-[92%] rounded-card rounded-bl-sm border border-oriel-line bg-oriel-white px-3.5 py-3">
                <span className="flex gap-1" aria-label="The assistant is typing">
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
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-oriel-line bg-oriel-white px-3 py-2.5"
          >
            <label htmlFor="chat-input" className="sr-only">
              Ask the Oriel Solar assistant
            </label>
            <input
              ref={inputRef}
              id="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about any product…"
              maxLength={500}
              className="h-11 w-full rounded-input border border-oriel-line px-3 text-small text-oriel-navy-ink placeholder:text-oriel-slate focus:border-oriel-navy focus:outline-none"
            />
            <Button type="submit" size="icon" disabled={pending || input.trim().length === 0}>
              <Send size={17} strokeWidth={1.75} aria-hidden />
              <span className="sr-only">Send</span>
            </Button>
          </form>

          <p className="border-t border-oriel-line bg-oriel-mist px-3 py-2 text-micro text-oriel-slate">
            AI assistant, not a person.{' '}
            <a
              href={CONTACT.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-oriel-green-deep underline underline-offset-2 hover:text-oriel-orange"
            >
              Chat with a human on WhatsApp
            </a>
          </p>
        </section>
      )}
    </>
  );
}
