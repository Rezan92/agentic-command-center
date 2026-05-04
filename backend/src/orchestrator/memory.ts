import prisma from '../database/client';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Fetches the last 10 messages for a conversation and formats them for the AI SDK.
 */
export async function getRecentContext(conversationId: string): Promise<ChatMessage[]> {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Reverse to get chronological order (asc) and format roles
  return messages.reverse().map((msg) => ({
    role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
    content: msg.content,
  }));
}
