import { NextResponse } from 'next/server';
import { markReadByVisitor, readOwnedConversation } from '@/lib/chat/store';

/**
 * Restores a visitor's conversation after a reload. The widget keeps the
 * conversation id in localStorage; this confirms it still belongs to that
 * visitor before returning the transcript.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const visitorId = params.get('visitorId')?.trim() ?? '';
  const conversationId = params.get('conversationId')?.trim() ?? '';

  if (!visitorId || !conversationId) {
    return NextResponse.json({ conversationId: null, status: 'bot', messages: [] });
  }

  try {
    const conversation = await readOwnedConversation(conversationId, visitorId);
    if (!conversation) {
      return NextResponse.json({ conversationId: null, status: 'bot', messages: [] });
    }

    if (conversation.unreadForVisitor > 0) {
      await markReadByVisitor(conversation.id);
    }

    return NextResponse.json({
      conversationId: conversation.id,
      status: conversation.status,
      messages: conversation.messages.slice(-30),
    });
  } catch (error) {
    console.error('Chat session failed:', error);
    return NextResponse.json({ conversationId: null, status: 'bot', messages: [] });
  }
}
