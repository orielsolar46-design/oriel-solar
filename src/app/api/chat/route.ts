import { NextResponse } from 'next/server';
import { z } from 'zod';
import { answerQuestion, type ChatMessage } from '@/lib/chat';

/**
 * The store assistant endpoint.
 *
 * Public by design: anyone shopping can ask a question. The route is limited
 * per IP so it cannot be used as a free LLM proxy, the history is capped, and
 * the answer only ever contains published catalogue data.
 */
export const dynamic = 'force-dynamic';

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const attempts = new Map<string, number[]>();

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(1000),
      })
    )
    .min(1)
    .max(20),
});

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

  try {
    const answer = await answerQuestion(parsed.data.messages as ChatMessage[]);
    return NextResponse.json(answer);
  } catch (error) {
    console.error('Chat failed:', error);
    return NextResponse.json(
      {
        reply:
          'Something went wrong on my side. Please try again, or message us on WhatsApp and we will help you straight away.',
        products: [],
        source: 'catalogue',
      },
      { status: 200 }
    );
  }
}
