import { notFound, redirect } from 'next/navigation';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { readConversation, visitorLabel, writeConversation } from '@/lib/chat/store';
import { ChatThread } from '@/components/admin/chats/chat-thread';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Chat' };

export default async function AdminChatPage({ params }: { params: { id: string } }) {
  if (!isStaffAuthenticated()) redirect('/admin/login');

  const conversation = await readConversation(params.id);
  if (!conversation) notFound();

  if (conversation.unreadForStaff > 0) {
    conversation.unreadForStaff = 0;
    await writeConversation(conversation);
  }

  return (
    <ChatThread initial={conversation} label={visitorLabel(conversation.visitorId)} />
  );
}
