import { NextResponse } from 'next/server';
import { markReadByVisitor, readOwnedConversation } from '@/lib/chat/store';

/**
 * Polled by the widget while it is open. Returns anything said since the last
 * message the visitor has, which is how a staff reply reaches them without a
 * websocket — and how the widget learns the chat has been taken over.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const visitorId = params.get('visitorId')?.trim() ?? '';
  const conversationId = params.get('conversationId')?.trim() ?? '';
  const after = params.get('after')?.trim() ?? '';

  if (!visitorId || !conversationId) {
    return NextResponse.json({ error: 'Missing conversation' }, { status: 400 });
  }

  try {
    // readConversation appends a cache marker, so a poll never reads a stale
    // document from the CDN.
    const conversation = await readOwnedConversation(conversationId, visitorId);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const messages = after
      ? conversation.messages.filter((message) => message.at > after)
      : conversation.messages.slice(-30);

    if (conversation.unreadForVisitor > 0) {
      await markReadByVisitor(conversation.id);
    }

    return NextResponse.json({
      conversationId: conversation.id,
      status: conversation.status,
      messages,
    });
  } catch (error) {
    console.error('Chat poll failed:', error);
    return NextResponse.json({ error: 'Chat unavailable' }, { status: 500 });
  }
}
