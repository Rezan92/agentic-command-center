import { Router } from 'express';
import prisma from '../database/client';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { getRecentContext, getSystemInstructions, ChatMessage } from '../orchestrator/memory';
import { toolRegistry } from '../orchestrator/schemas';
import { dispatchToolCall } from '../orchestrator/dispatcher';

const router = Router();

// Configure Google Provider
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
});

// GET /api/conversations (unchanged)
router.get('/conversations', async (req, res, next) => {
  try {
    const userId = res.locals.userId;
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(conversations);
  } catch (error) { next(error); }
});

// GET /api/conversations/:id/messages (unchanged)
router.get('/conversations/:id/messages', async (req, res, next) => {
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (error) { next(error); }
});

// POST /api/chat - AI Orchestrator with Progress Feedback
router.post('/chat', async (req, res, next) => {
  console.log('\n=== [ORCHESTRATOR REQUEST] ===');
  try {
    const { message, conversationId } = req.body;
    const userId = res.locals.userId;

    // 1. Context & Setup
    let targetConversationId = conversationId;
    if (!targetConversationId) {
      const newConv = await prisma.conversation.create({
        data: { userId, title: message.substring(0, 30) },
      });
      targetConversationId = newConv.id;
    }

    const history = await getRecentContext(targetConversationId);
    const systemPrompt = getSystemInstructions();

    await prisma.message.create({
      data: { conversationId: targetConversationId, role: 'USER', content: message },
    });

    const promptMessages = [...history, { role: 'user', content: message }];

    // Prepare for manual streaming with progress updates
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    let accumulatedResponse = '';

    // 2. Tool Mapping
    const tools: Record<string, any> = {};
    Object.entries(toolRegistry).forEach(([name, definition]) => {
      tools[name] = tool({
        description: definition.description,
        parameters: definition.parameters,
        execute: async (params) => {
          // Send visual feedback to the user immediately
          const feedback = `\n\n> *Action: Using ${name.replace(/_/g, ' ')}...*\n\n`;
          res.write(feedback);
          accumulatedResponse += feedback;

          const result = await dispatchToolCall(name, params);
          return result;
        },
      });
    });

    // 3. Execution Loop
    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      messages: promptMessages as any,
      tools,
      maxSteps: 5,
      onFinish: async ({ text }) => {
        // Save the full trail (including our manual feedback) to the DB
        const finalContent = accumulatedResponse + (text || '');
        if (finalContent.trim()) {
          await prisma.message.create({
            data: {
              conversationId: targetConversationId,
              role: 'ASSISTANT',
              content: finalContent,
            },
          });
          console.log('[Orchestrator] Saved final consolidated response.');
        }
      },
    });

    // 4. Stream consumption
    for await (const delta of result.textStream) {
      if (delta) {
        accumulatedResponse += delta;
        res.write(delta);
      }
    }

    res.end();

  } catch (error: any) {
    console.error('[Orchestrator] Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Internal Error' });
    else res.end();
  }
});

export default router;
