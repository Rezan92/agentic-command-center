import { Router } from 'express';
import prisma from '../database/client';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { getRecentContext, getSystemInstructions, ChatMessage } from '../orchestrator/memory';

const router = Router();

// Configure Google Provider
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
});

// GET /api/conversations - Fetch user's conversations
router.get('/conversations', async (req, res, next) => {
  try {
    const userId = res.locals.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized - No User ID' });

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

// GET /api/conversations/:id/messages - Fetch messages for a specific conversation
router.get('/conversations/:id/messages', async (req, res, next) => {
  try {
    const { id } = req.params;
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

// POST /api/chat - AI Orchestrator with Streaming & System Persona
router.post('/chat', async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;
    const userId = res.locals.userId;

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'AI Configuration Error: Missing API Key' });
    }

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // 1. Ensure conversation exists
    let targetConversationId = conversationId;
    if (!targetConversationId) {
      const newConversation = await prisma.conversation.create({
        data: {
          userId,
          title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
        },
      });
      targetConversationId = newConversation.id;
    }

    // 2. Fetch context and system prompt
    const history = await getRecentContext(targetConversationId);
    const systemPrompt = getSystemInstructions();

    // 3. Save User Message to DB immediately
    await prisma.message.create({
      data: {
        conversationId: targetConversationId,
        role: 'USER',
        content: message,
      },
    });

    // 4. Construct strictly typed messages array for LLM
    const promptMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    console.log(`[Backend] Streaming Turn: User -> ${targetConversationId}`);

    // 5. Execute AI call
    const result = streamText({
      model: google('gemini-2.5-flash'),
      messages: promptMessages as any,
      onFinish: async ({ text }) => {
        // Save Assistant Message to DB
        await prisma.message.create({
          data: {
            conversationId: targetConversationId,
            role: 'ASSISTANT',
            content: text,
          },
        });
      },
    });

    // 6. Manual Streaming to Express
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const textPart of result.textStream) {
      res.write(textPart);
    }

    res.end();

  } catch (error: any) {
    console.error('[Backend] Chat Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    } else {
      res.end();
    }
  }
});

export default router;
