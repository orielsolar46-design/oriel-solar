import { NextResponse } from 'next/server';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { listConversations } from '@/lib/chat/store';

/**
 * Staff view of every conversation the website assistant has had.
 *
 * Transcripts are read from the private chat bucket; only a signed-in staff
 * session can see them. `?count=1` is the cheap shape the nav badge polls.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isStaffAuthenticated()) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  try {
    const conversations = await listConversations();
    if (new URL(request.url).searchParams.get('count') === '1') {
      return NextResponse.json({
        unread: conversations.filter((c) => c.unreadForStaff > 0).length,
      });
    }
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Chat list failed:', error);
    return NextResponse.json({ error: 'Could not load chats' }, { status: 500 });
  }
}
