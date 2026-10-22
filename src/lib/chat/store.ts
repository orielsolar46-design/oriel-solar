import 'server-only';
import { randomUUID } from 'crypto';

/**
 * Chat transcripts.
 *
 * Conversations are small JSON documents in a private Supabase Storage bucket
 * (`chat-transcripts`). That is deliberate: the storefront database is managed
 * through numbered SQL migrations that are applied by hand in the Supabase SQL
 * editor, and the back office needed transcripts working before the next
 * migration window. Storage is already provisioned, the service key is already
 * on the server, and a transcript is a document — one file per conversation is
 * a natural fit.
 *
 * The shape is versionless because there is only one writer that defines it:
 * this module. Reads tolerate a missing field so an older file never crashes a
 * screen. Messages are capped at MAX_MESSAGES; a chat is a conversation, not an
 * archive.
 *
 * Concurrency: the bot and a staff member can each append within the same
 * second during a handover. The read-modify-write here can lose a message only
 * if both writes land inside the same few milliseconds; at this shop's volume
 * that is an acceptable trade for not needing a schema migration. Noted in
 * DECISIONS.md with the table-based upgrade.
 */

const BUCKET = 'chat-transcripts';
const PREFIX = 'conversations/';
const MAX_MESSAGES = 200;
const CACHE_BUST = () => `?v=${Date.now()}`;

export type ChatRole = 'user' | 'assistant' | 'agent' | 'system';
export type ChatStatus = 'bot' | 'human' | 'closed';

export type ChatMessageRecord = {
  id: string;
  role: ChatRole;
  content: string;
  at: string;
  /** Display name for staff messages. */
  author?: string;
};

export type ChatConversation = {
  id: string;
  visitorId: string;
  status: ChatStatus;
  createdAt: string;
  updatedAt: string;
  page: string | null;
  userAgent: string | null;
  unreadForStaff: number;
  unreadForVisitor: number;
  messages: ChatMessageRecord[];
};

export type ChatConversationSummary = Omit<ChatConversation, 'messages'> & {
  lastMessage: string | null;
  lastRole: ChatRole | null;
  messageCount: number;
};

function config(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Chat storage needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return { url, key };
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const { key } = config();
  return { Authorization: `Bearer ${key}`, apikey: key, ...extra };
}

function objectPath(id: string): string {
  return `${BUCKET}/${PREFIX}${id}.json`;
}

export function newMessage(role: ChatRole, content: string, author?: string): ChatMessageRecord {
  return { id: randomUUID(), role, content, at: new Date().toISOString(), ...(author ? { author } : {}) };
}

export function newConversation(
  visitorId: string,
  meta: { page?: string | null; userAgent?: string | null }
): ChatConversation {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    visitorId,
    status: 'bot',
    createdAt: now,
    updatedAt: now,
    page: meta.page ?? null,
    userAgent: meta.userAgent ? meta.userAgent.slice(0, 200) : null,
    unreadForStaff: 0,
    unreadForVisitor: 0,
    messages: [],
  };
}

export async function readConversation(id: string): Promise<ChatConversation | null> {
  const { url } = config();
  const response = await fetch(`${url}/storage/v1/object/${objectPath(id)}${CACHE_BUST()}`, {
    headers: headers({ 'cache-control': 'no-cache' }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) return null;
  try {
    const data = (await response.json()) as ChatConversation;
    return {
      ...data,
      messages: Array.isArray(data.messages) ? data.messages : [],
      unreadForStaff: data.unreadForStaff ?? 0,
      unreadForVisitor: data.unreadForVisitor ?? 0,
      status: data.status ?? 'bot',
    };
  } catch {
    return null;
  }
}

export async function writeConversation(
  conversation: ChatConversation,
  touch = false
): Promise<void> {
  const { url } = config();
  // Only real activity moves a conversation up the list. Clearing an unread
  // marker is housekeeping, not a new message, so it must not rewrite the
  // timestamp the inbox sorts and labels by.
  if (touch) conversation.updatedAt = new Date().toISOString();
  const response = await fetch(`${url}/storage/v1/object/${objectPath(conversation.id)}`, {
    method: 'PUT',
    headers: headers({
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'x-upsert': 'true',
    }),
    body: JSON.stringify(conversation),
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`Could not save the chat (${response.status}).`);
  }
}

export async function createConversation(
  visitorId: string,
  meta: { page?: string | null; userAgent?: string | null }
): Promise<ChatConversation> {
  const conversation = newConversation(visitorId, meta);
  await writeConversation(conversation);
  return conversation;
}

/** Read by id, checking that the conversation belongs to this visitor. */
export async function readOwnedConversation(
  id: string,
  visitorId: string
): Promise<ChatConversation | null> {
  const conversation = await readConversation(id);
  if (!conversation || conversation.visitorId !== visitorId) return null;
  return conversation;
}

export async function appendMessage(
  id: string,
  message: ChatMessageRecord
): Promise<ChatConversation | null> {
  const conversation = await readConversation(id);
  if (!conversation) return null;
  return appendTo(conversation, message);
}

export async function appendTo(
  conversation: ChatConversation,
  message: ChatMessageRecord
): Promise<ChatConversation> {
  conversation.messages.push(message);
  if (conversation.messages.length > MAX_MESSAGES) {
    conversation.messages = conversation.messages.slice(-MAX_MESSAGES);
  }
  if (message.role === 'user') conversation.unreadForStaff += 1;
  if (message.role === 'assistant' || message.role === 'agent') conversation.unreadForVisitor += 1;
  conversation.updatedAt = message.at;
  await writeConversation(conversation);
  return conversation;
}

export async function setStatus(
  conversation: ChatConversation,
  status: ChatStatus,
  note?: string
): Promise<ChatConversation> {
  conversation.status = status;
  if (note) conversation.messages.push(newMessage('system', note));
  await writeConversation(conversation, true);
  return conversation;
}

export async function markReadByStaff(id: string): Promise<void> {
  const conversation = await readConversation(id);
  if (!conversation || conversation.unreadForStaff === 0) return;
  conversation.unreadForStaff = 0;
  await writeConversation(conversation);
}

export async function markReadByVisitor(id: string): Promise<void> {
  const conversation = await readConversation(id);
  if (!conversation || conversation.unreadForVisitor === 0) return;
  conversation.unreadForVisitor = 0;
  await writeConversation(conversation);
}

function summarise(conversation: ChatConversation): ChatConversationSummary {
  const last = conversation.messages[conversation.messages.length - 1];
  const { messages, ...rest } = conversation;
  return {
    ...rest,
    lastMessage: last?.content ?? null,
    lastRole: last?.role ?? null,
    messageCount: messages.length,
  };
}

export async function listConversations(limit = 60): Promise<ChatConversationSummary[]> {
  const { url } = config();
  const response = await fetch(`${url}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers: headers({ 'content-type': 'application/json' }),
    body: JSON.stringify({
      prefix: PREFIX,
      limit,
      offset: 0,
      sortBy: { column: 'updated_at', order: 'desc' },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`Could not list chats (${response.status}).`);
  }

  const entries = (await response.json()) as { name: string }[];
  const ids = entries
    .map((entry) => entry.name)
    .map((name) => (name.startsWith(PREFIX) ? name.slice(PREFIX.length) : name))
    .map((name) => name.replace(/\.json$/, ''))
    .filter(Boolean);

  const conversations = await Promise.all(ids.map((id) => readConversation(id)));
  return conversations
    .filter((c): c is ChatConversation => c !== null)
    .map(summarise)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** A short, human label for a visitor: "Visitor 4F2A". */
export function visitorLabel(visitorId: string): string {
  return `Visitor ${visitorId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`;
}
