import { NextResponse } from 'next/server';
import { z } from 'zod';
import { answerQuestion, type ChatMessage } from '@/lib/chat';
import {
  appendTo,
  createConversation,
  newMessage,
  readOwnedConversation,
} from '@/lib/chat/store';

/**
 * Baraka, the shop assistant.
 *
 * Public by design: anyone shopping can ask a question. Every exchange is
 * written to the conversation transcript so the shop can read it later and,
 * if needed, take the chat over from the assistant. The route is limited per
 * IP so it cannot be used as a free LLM proxy, and the catalogue is the only
 * source of product facts.
 */
export const dynamic = 'force-dynamic';

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const attempts = new Map<string, number[]>();

const schema = z.object({
  visitorId: z
    .string()
    .min(8)
    .max(64)
    .regex(/^[a-zA-Z0-9-]+$/),
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(1000),
  page: z.string().max(200).optional(),
});

function tail<T>(items: T[], count = 30): T[] {
  return items.slice(-count);
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    attempts.set(ip, recent);
    return NextResponse.json(
      { error: 'Too many questions at once. Try again in a minute.' },
      { status: 429 }
    );
  }
  attempts.set(ip, [...recent, now]);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ask a question and try again.' }, { status: 400 });
  }

  const { visitorId, conversationId, message, page } = parsed.data;
  const userAgent = request.headers.get('user-agent');

  try {
    let conversation = conversationId
      ? await readOwnedConversation(conversationId, visitorId)
      : null;

    // A closed chat starts a fresh one on the next message; the transcript is
    // kept, but the visitor gets a clean thread rather than talking into a
    // closed door.
    if (!conversation || conversation.status === 'closed') {
      conversation = await createConversation(visitorId, { page, userAgent });
    }

    conversation.page = page ?? conversation.page;
    conversation = await appendTo(conversation, newMessage('user', message));

    if (conversation.status === 'human') {
      return NextResponse.json({
        conversationId: conversation.id,
        status: 'human',
        messages: tail(conversation.messages),
        reply: null,
        products: [],
        source: 'human',
      });
    }

    const history: ChatMessage[] = conversation.messages
      .filter((entry) => entry.role !== 'system')
      .slice(-8)
      .map((entry) => ({
        role: entry.role === 'agent' ? 'assistant' : entry.role,
        content: entry.content,
      })) as ChatMessage[];

    const answer = await answerQuestion(history);

    conversation = await appendTo(
      conversation,
      newMessage('assistant', answer.reply)
    );

    return NextResponse.json({
      conversationId: conversation.id,
      status: conversation.status,
      messages: tail(conversation.messages),
      reply: answer.reply,
      products: answer.products,
      source: answer.source,
    });
  } catch (error) {
    console.error('Chat failed:', error);
    return NextResponse.json(
      {
        error:
          'Baraka could not answer just now. Please try again, or message us on WhatsApp.',
      },
      { status: 500 }
    );
  }
}
