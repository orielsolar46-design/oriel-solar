import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { guardAdminWrite } from '@/lib/admin/guard';
import {
  appendTo,
  newMessage,
  readConversation,
  setStatus,
  writeConversation,
} from '@/lib/chat/store';

/**
 * One conversation, for the staff transcript screen.
 *
 * GET reads it and clears the "needs a reply" marker. POST is the handover:
 * take over, reply as a person, hand back to Baraka, close or reopen. A reply
 * is refused unless the chat has actually been taken over, so a staff member
 * cannot accidentally talk over the assistant.
 */
export const dynamic = 'force-dynamic';

const actionSchema = z.object({
  action: z.enum(['takeover', 'release', 'close', 'reopen', 'reply']),
  content: z.string().trim().min(1).max(1000).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!isStaffAuthenticated()) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  try {
    const conversation = await readConversation(params.id);
    if (!conversation) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    if (conversation.unreadForStaff > 0) {
      conversation.unreadForStaff = 0;
      await writeConversation(conversation);
    }
    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Chat read failed:', error);
    return NextResponse.json({ error: 'Could not load the chat' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const failure = guardAdminWrite(request);
  if (failure) {
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  try {
    const conversation = await readConversation(params.id);
    if (!conversation) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    conversation.unreadForStaff = 0;

    const { action, content } = parsed.data;

    switch (action) {
      case 'takeover':
        if (conversation.status !== 'human') {
          await setStatus(conversation, 'human', 'Oriel team joined the chat.');
        } else {
          await writeConversation(conversation);
        }
        break;
      case 'release':
        await setStatus(conversation, 'bot', 'Oriel team handed the chat back to Baraka.');
        break;
      case 'close':
        await setStatus(conversation, 'closed', 'Oriel team closed the chat.');
        break;
      case 'reopen':
        await setStatus(conversation, 'bot', 'Oriel team reopened the chat.');
        break;
      case 'reply':
        if (conversation.status !== 'human') {
          return NextResponse.json(
            { error: 'Take over the chat before replying as a person.' },
            { status: 409 }
          );
        }
        if (!content) {
          return NextResponse.json({ error: 'Write a reply first.' }, { status: 400 });
        }
        await appendTo(conversation, newMessage('agent', content, 'Oriel team'));
        break;
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Chat action failed:', error);
    return NextResponse.json({ error: 'Could not update the chat' }, { status: 500 });
  }
}
