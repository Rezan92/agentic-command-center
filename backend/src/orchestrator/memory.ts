import fs from 'fs';
import path from 'path';
import prisma from '../database/client';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Fetches the system instructions from the prompts directory and injects dynamic context.
 */
export function getSystemInstructions(): string {
  try {
    const filePath = path.join(process.cwd(), 'src/prompts/supervisor.md');
    let content = fs.readFileSync(filePath, 'utf8');

    // Inject Current Date/Time for context-aware relative dates (e.g. "Next Wednesday")
    const now = new Date();
    const dateContext = `\n\n## Current Context\n- Current Time: ${now.toISOString()}\n- Today is: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
    
    return content + dateContext;
  } catch (error) {
    console.error('Failed to read system instructions:', error);
    return `You are a helpful AI assistant. Current Time: ${new Date().toISOString()}`;
  }
}

/**
 * Fetches the last 10 messages for a conversation and formats them for the AI SDK.
 * Ensures the roles are correctly mapped and history is clean.
 */
export async function getRecentContext(conversationId: string): Promise<ChatMessage[]> {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Reverse to get chronological order (asc)
  const formatted = messages.reverse().map((msg) => ({
    role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
    content: msg.content,
  }));

  // Professional Tip: Filter out consecutive messages with the same role 
  // to prevent the AI from getting confused by "User, User, User" blocks.
  const collapsed: ChatMessage[] = [];
  for (const msg of formatted) {
    if (collapsed.length > 0 && collapsed[collapsed.length - 1].role === msg.role) {
      collapsed[collapsed.length - 1].content += `\n${msg.content}`;
    } else {
      collapsed.push(msg);
    }
  }

  return collapsed;
}
