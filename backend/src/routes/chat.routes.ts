import { Router } from 'express';
import prisma from '../database/client';

const router = Router();

// GET /api/conversations - Fetch user's conversations
router.get('/conversations', async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

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

// POST /api/chat - Save user message and return mock response
router.post('/chat', async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // 1. Ensure a conversation exists or create one
    let targetConversationId = conversationId;
    if (!targetConversationId) {
      const newConversation = await prisma.conversation.create({
        data: {
          userId,
          title: message.substring(0, 30) + '...',
        },
      });
      targetConversationId = newConversation.id;
    }

    // 2. Save User Message
    await prisma.message.create({
      data: {
        conversationId: targetConversationId,
        role: 'USER',
        content: message,
      },
    });

    // 3. Mock Assistant Response (Will be AI in Epic 3)
    const mockContent = "I am the mock backend. I have saved your message to Postgres.";
    
    // Save Assistant Message
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: targetConversationId,
        role: 'ASSISTANT',
        content: mockContent,
      },
    });

    res.json({
      conversationId: targetConversationId,
      message: assistantMessage,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
