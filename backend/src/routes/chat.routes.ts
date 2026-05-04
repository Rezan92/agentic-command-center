import { Router } from 'express';
import prisma from '../database/client';
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { getRecentContext } from '../orchestrator/memory';

const router = Router();

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

// POST /api/chat - AI Orchestrator with Streaming
router.post('/chat', async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;
    const userId = res.locals.userId;

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

    // 2. Fetch recent context
    const history = await getRecentContext(targetConversationId);

    // 3. Save User Message to DB
    await prisma.message.create({
      data: {
        conversationId: targetConversationId,
        role: 'USER',
        content: message,
      },
    });

    // 4. Stream AI Response
    const result = streamText({
      model: google('gemini-1.5-pro'),
      messages: [
        ...history,
        { role: 'user', content: message }
      ],
      onFinish: async ({ text }) => {
        // Save Assistant Message to DB when finished
        await prisma.message.create({
          data: {
            conversationId: targetConversationId,
            role: 'ASSISTANT',
            content: text,
          },
        });
      },
    });

    // Return the stream as a DataStreamResponse
    return result.toDataStreamResponse().then(streamRes => {
      // Set headers for SSE-like streaming if needed, though toDataStreamResponse handles most
      streamRes.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      
      // Pipe the body to express res
      const reader = streamRes.body?.getReader();
      const writer = res;
      
      if (!reader) return res.end();

      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        return pump();
      };
      
      return pump();
    });

  } catch (error) {
    next(error);
  }
});

export default router;
