import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowUpRight, MessagesSquare } from 'lucide-react';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { listConversations, visitorLabel } from '@/lib/chat/store';
import { ChatRefresh } from '@/components/admin/chats/chat-refresh';
import {
  EmptyState,
  FilterChips,
  PageHeader,
  Pill,
} from '@/components/admin/ui';
import { cn } from '@/lib/utils';

type PillTone = 'plain' | 'navy' | 'green' | 'gold' | 'orange' | 'danger';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Chats' };

function when(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const STATUS: Record<string, { label: string; tone: PillTone }> = {
  bot: { label: 'Baraka', tone: 'navy' },
  human: { label: 'Needs you', tone: 'orange' },
  closed: { label: 'Closed', tone: 'plain' },
};

export default async function AdminChatsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  if (!isStaffAuthenticated()) redirect('/admin/login');

  let conversations: Awaited<ReturnType<typeof listConversations>> = [];
  let failure = false;
  try {
    conversations = await listConversations();
  } catch (error) {
    console.error('Admin chat list failed:', error);
    failure = true;
  }
  const filter = searchParams.filter ?? 'all';

  const needs = conversations.filter((c) => c.unreadForStaff > 0);
  const human = conversations.filter((c) => c.status === 'human');
  const closed = conversations.filter((c) => c.status === 'closed');

  const visible =
    filter === 'needs'
      ? needs
      : filter === 'human'
        ? human
        : filter === 'closed'
          ? closed
          : conversations;

  return (
    <div className="space-y-5">
      <ChatRefresh />
      <PageHeader
        title="Chats"
        subtitle="The latest conversations with Baraka, and any a person has joined."
      />

      <FilterChips
        filters={[
          { id: 'all', label: 'All', count: conversations.length },
          { id: 'needs', label: 'Unread', count: needs.length },
          { id: 'human', label: 'With a person', count: human.length },
          { id: 'closed', label: 'Closed', count: closed.length },
        ]}
        active={filter}
        hrefFor={(id) => (id === 'all' ? '/admin/chats' : `/admin/chats?filter=${id}`)}
      />

      {failure ? (
        <EmptyState
          title="Chats could not be loaded"
          hint="The transcript store did not answer. Refresh in a moment — conversations are still being kept."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={filter === 'all' ? 'No conversations yet' : 'Nothing in this view'}
          hint={
            filter === 'all'
              ? 'When a visitor asks Baraka something, the whole conversation lands here.'
              : 'Try another filter, or wait for the next visitor.'
          }
        />
      ) : (
        <ul className="overflow-hidden rounded-panel border border-oriel-line bg-oriel-white shadow-oriel-panel">
          {visible.map((conversation) => {
            const state = STATUS[conversation.status] ?? STATUS.bot;
            const unread = conversation.unreadForStaff;
            return (
              <li key={conversation.id} className="border-b border-oriel-line last:border-b-0">
                <Link
                  href={`/admin/chats/${conversation.id}`}
                  className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-oriel-mist/50 sm:gap-4 sm:px-5"
                >
                  <span
                    className={cn(
                      'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-micro font-semibold uppercase tracking-wide',
                      conversation.status === 'human'
                        ? 'bg-oriel-green-soft text-oriel-green-deep'
                        : 'bg-oriel-navy/10 text-oriel-navy'
                    )}
                    aria-hidden
                  >
                    <MessagesSquare size={18} strokeWidth={1.6} />
                    {unread > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-pill bg-oriel-orange px-1 font-mono text-[0.625rem] font-semibold text-oriel-white">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-headline text-small font-semibold text-oriel-navy">
                        {visitorLabel(conversation.visitorId)}
                      </span>
                      <Pill tone={state.tone}>{state.label}</Pill>
                      <span className="font-mono text-[0.6875rem] text-oriel-slate">
                        {when(conversation.updatedAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-micro text-oriel-slate">
                      {conversation.lastRole === 'user' ? 'Visitor: ' : ''}
                      {conversation.lastMessage ?? 'No messages yet'}
                    </span>
                  </span>

                  <ArrowUpRight
                    size={17}
                    strokeWidth={1.5}
                    className="shrink-0 text-oriel-slate transition-colors group-hover:text-oriel-orange"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-micro text-oriel-slate">
        Transcripts are private to the back office and kept in the shop&apos;s Supabase project.
      </p>
    </div>
  );
}
