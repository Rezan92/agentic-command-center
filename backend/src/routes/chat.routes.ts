import { Router } from 'express';
import prisma from '../database/client';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { getRecentContext } from '../orchestrator/memory';

const router = Router();

// Configure Google Provider explicitly to handle both env variable names
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

// POST /api/chat - AI Orchestrator with Manual Streaming & Debug Logging
router.post('/chat', async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;
    const userId = res.locals.userId;

    console.log('[Backend] New chat request:', { message, conversationId, userId });

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[Backend] CRITICAL: No Google/Gemini API key found in environment variables.');
      return res.status(500).json({ error: 'AI Configuration Error: Missing API Key' });
    }

    if (!userId) {
      console.error('[Backend] Unauthorized: No userId in res.locals');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1. Ensure conversation exists
    let targetConversationId = conversationId;
    if (!targetConversationId) {
      console.log('[Backend] No conversationId provided, creating new one...');
      const newConversation = await prisma.conversation.create({
        data: {
          userId,
          title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
        },
      });
      targetConversationId = newConversation.id;
      console.log('[Backend] Created conversation:', targetConversationId);
    }

    // 2. Fetch recent context
    console.log('[Backend] Fetching context for:', targetConversationId);
    const history = await getRecentContext(targetConversationId);
    console.log('[Backend] Found history turns:', history.length);

    // 3. Save User Message to DB
    console.log('[Backend] Saving user message...');
    await prisma.message.create({
      data: {
        conversationId: targetConversationId,
        role: 'USER',
        content: message,
      },
    });

    // 4. Execute AI call
    console.log('[Backend] Initializing Gemini stream...');
    
    const messages: any[] = [
      ...history,
      { role: 'user', content: message }
    ];

    const result = streamText({
      model: google('gemini-2.5-flash'),
      messages,
      onFinish: async ({ text }) => {
        console.log('[Backend] Stream finished, saving assistant message. Length:', text.length);
        await prisma.message.create({
          data: {
            conversationId: targetConversationId,
            role: 'ASSISTANT',
            content: text,
          },
        });
      },
    });

    // 5. Manual Streaming to Express
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Connection', 'keep-alive');

    console.log('[Backend] Starting stream loop...');
    let chunkCount = 0;
    let fullResponse = '';

    for await (const textPart of result.textStream) {
      chunkCount++;
      fullResponse += textPart;
      console.log(`[Backend] Chunk ${chunkCount}: "${textPart}"`);
      res.write(textPart);
    }

    if (chunkCount === 0) {
      console.error('[Backend] WARNING: Stream completed with ZERO chunks.');
    } else {
      console.log(`[Backend] Stream loop complete. Total chunks: ${chunkCount}. Full Length: ${fullResponse.length}`);
    }
    res.end();

  } catch (error: any) {
    console.error('[Backend] Streaming Route Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    } else {
      res.end();
    }
  }
});

export default router;
