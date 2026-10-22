'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCheck, MessageSquareReply, RotateCcw, Send, UserRound, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ChatRole = 'user' | 'assistant' | 'agent' | 'system';
type ChatStatus = 'bot' | 'human' | 'closed';

type Message = {
  id: string;
  role: ChatRole;
  content: string;
  at: string;
  author?: string;
};

export type ThreadConversation = {
  id: string;
  visitorId: string;
  status: ChatStatus;
  createdAt: string;
  updatedAt: string;
  page: string | null;
  userAgent: string | null;
  unreadForStaff: number;
  messages: Message[];
};

function stamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-KE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

const STATUS_COPY: Record<ChatStatus, { label: string; className: string }> = {
  bot: { label: 'Baraka is answering', className: 'bg-oriel-navy/10 text-oriel-navy' },
  human: { label: 'You are in this chat', className: 'bg-oriel-green-soft text-oriel-green-deep' },
  closed: { label: 'Closed', className: 'bg-oriel-mist text-oriel-slate' },
};

/**
 * The staff side of a conversation.
 *
 * Polling, not sockets: a four-second read keeps the transcript current while
 * a staff member is looking at it, and stops when the tab is hidden. Replying
 * is deliberately gated on taking the chat over first, so the assistant and a
 * person never answer the same message.
 */
export function ChatThread({
  initial,
  label,
}: {
  initial: ThreadConversation;
  label: string;
}) {
  const [conversation, setConversation] = React.useState(initial);
  const [input, setInput] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const scrollToEnd = React.useCallback(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, []);

  React.useEffect(() => {
    scrollToEnd();
  }, [conversation.messages.length, scrollToEnd]);

  React.useEffect(() => {
    let cancelled = false;
    const timer = window.setInterval(async () => {
      if (document.visibilityState !== 'visible' || pending) return;
      try {
        const response = await fetch(`/api/admin/chats/${conversation.id}`, {
          cache: 'no-store',
        });
        if (!response.ok) return;
        const data = (await response.json()) as { conversation: ThreadConversation };
        if (!cancelled) setConversation(data.conversation);
      } catch {
        /* a missed poll is not worth a banner */
      }
    }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [conversation.id, pending]);

  const act = async (action: 'takeover' | 'release' | 'close' | 'reopen' | 'reply') => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/chats/${conversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ...(action === 'reply' ? { content: input.trim() } : {}),
        }),
      });
      const data = (await response.json()) as {
        conversation?: ThreadConversation;
        error?: string;
      };
      if (!response.ok || !data.conversation) {
        setError(data.error ?? 'Could not update the chat.');
        return;
      }
      setConversation(data.conversation);
      if (action === 'reply') setInput('');
      window.setTimeout(scrollToEnd, 60);
    } catch {
      setError('Could not reach the server. Try again.');
    } finally {
      setPending(false);
    }
  };

  const status = STATUS_COPY[conversation.status];
  const canReply = conversation.status === 'human';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/chats">
            <ArrowLeft size={15} aria-hidden /> All chats
          </Link>
        </Button>
        <span className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-pill bg-oriel-navy/10 text-oriel-navy">
            <UserRound size={17} strokeWidth={1.5} aria-hidden />
          </span>
          <span>
            <span className="block font-headline text-small font-semibold leading-tight text-oriel-navy">
              {label}
            </span>
            <span className="block font-mono text-[0.6875rem] text-oriel-slate">
              Started {stamp(conversation.createdAt)}
              {conversation.page ? ` · ${conversation.page}` : ''}
            </span>
          </span>
        </span>
        <span
          className={cn(
            'inline-flex h-7 items-center rounded-pill px-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.1em]',
            status.className
          )}
        >
          {status.label}
        </span>

        <span className="ml-auto flex flex-wrap items-center gap-2">
          {conversation.status === 'bot' && (
            <Button size="sm" onClick={() => act('takeover')} disabled={pending}>
              <MessageSquareReply size={15} aria-hidden /> Take over
            </Button>
          )}
          {conversation.status === 'human' && (
            <>
              <Button variant="outline" size="sm" onClick={() => act('release')} disabled={pending}>
                <CheckCheck size={15} aria-hidden /> Hand back to Baraka
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => act('close')}
                disabled={pending}
                className="text-oriel-orange-deep hover:bg-oriel-orange-soft"
              >
                <XCircle size={15} aria-hidden /> Close
              </Button>
            </>
          )}
          {conversation.status === 'closed' && (
            <Button variant="outline" size="sm" onClick={() => act('reopen')} disabled={pending}>
              <RotateCcw size={15} aria-hidden /> Reopen
            </Button>
          )}
        </span>
      </div>

      <section className="overflow-hidden rounded-panel border border-oriel-line bg-oriel-white shadow-oriel-panel">
        <div
          ref={listRef}
          className="h-[54vh] min-h-[18rem] space-y-3 overflow-y-auto bg-oriel-mist/60 px-4 py-4 sm:px-5"
        >
          {conversation.messages.length === 0 && (
            <p className="py-10 text-center text-micro text-oriel-slate">
              No messages in this conversation yet.
            </p>
          )}

          {conversation.messages.map((message) => {
            if (message.role === 'system') {
              return (
                <p key={message.id} className="text-center text-[0.6875rem] text-oriel-slate">
                  {message.content} · {stamp(message.at)}
                </p>
              );
            }

            const fromShop = message.role !== 'user';

            return (
              <div
                key={message.id}
                className={cn('flex flex-col gap-1', fromShop ? 'items-end' : 'items-start')}
              >
                <span className="px-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-oriel-slate">
                  {message.role === 'user'
                    ? label
                    : message.role === 'agent'
                      ? (message.author ?? 'Oriel team')
                      : 'Baraka'}
                </span>
                <div
                  className={cn(
                    'max-w-[88%] rounded-panel px-3.5 py-2.5 text-small shadow-oriel-rest sm:max-w-[75%]',
                    message.role === 'user'
                      ? 'rounded-bl-sm border border-oriel-line bg-oriel-white text-oriel-navy-ink'
                      : message.role === 'agent'
                        ? 'rounded-br-sm bg-oriel-green-soft text-oriel-green-deep'
                        : 'rounded-br-sm bg-[rgba(11,42,107,0.07)] text-oriel-navy-ink'
                  )}
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
                  <p className="mt-1 text-right font-mono text-[0.5625rem] text-oriel-slate/80">
                    {stamp(message.at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (canReply && input.trim()) act('reply');
          }}
          className="border-t border-oriel-line bg-oriel-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-4"
        >
          {error && (
            <p className="mb-2 rounded-input bg-oriel-orange-soft px-3 py-2 text-micro text-oriel-orange-deep">
              {error}
            </p>
          )}
          <div className="flex items-end gap-2">
            <label htmlFor="chat-reply" className="sr-only">
              Reply to this conversation
            </label>
            <textarea
              id="chat-reply"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (canReply && input.trim()) act('reply');
                }
              }}
              rows={2}
              maxLength={1000}
              disabled={!canReply || pending}
              placeholder={
                canReply
                  ? 'Reply as Oriel team…'
                  : conversation.status === 'closed'
                    ? 'This chat is closed. Reopen it to reply.'
                    : 'Take over the chat to reply as a person.'
              }
              className="min-h-[3rem] w-full resize-none rounded-panel border border-oriel-line px-3 py-2 text-small text-oriel-navy-ink placeholder:text-oriel-slate focus:border-oriel-navy focus:outline-none disabled:bg-oriel-mist"
            />
            <Button type="submit" disabled={!canReply || pending || input.trim().length === 0}>
              <Send size={16} aria-hidden /> Send
            </Button>
          </div>
          {!canReply && conversation.status === 'bot' && (
            <p className="mt-2 text-micro text-oriel-slate">
              Baraka is handling this chat. Take it over to answer yourself.
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
