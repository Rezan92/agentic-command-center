import { Router } from 'express';
import prisma from '../database/client';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { getRecentContext, getSystemInstructions, ChatMessage } from '../orchestrator/memory';
import { toolRegistry } from '../orchestrator/schemas';
import { dispatchToolCall } from '../orchestrator/dispatcher';

const router = Router();

// Configure Google Provider
// Reverting to gemini-2.5-flash as requested by the user.
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

// POST /api/chat - AI Orchestrator with Tool Calling & Streaming
router.post('/chat', async (req, res, next) => {
  console.log('[Orchestrator] POST /chat request received');
  try {
    const { message, conversationId } = req.body;
    const userId = res.locals.userId;

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[Orchestrator] Missing API Key');
      return res.status(500).json({ error: 'AI Configuration Error: Missing API Key' });
    }

    if (!userId) {
      console.warn('[Orchestrator] Unauthorized request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1. Ensure conversation exists
    let targetConversationId = conversationId;
    if (!targetConversationId) {
      console.log('[Orchestrator] Creating new conversation');
      const newConversation = await prisma.conversation.create({
        data: {
          userId,
          title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
        },
      });
      targetConversationId = newConversation.id;
    }

    // 2. Fetch context and system prompt
    console.log('[Orchestrator] Fetching context and system prompt');
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

    // 4. Construct messages array (excluding system prompt for the 'system' field)
    const promptMessages = [
      ...history,
      { role: 'user', content: message }
    ];

    console.log(`[Orchestrator] Turn Started: User -> ${targetConversationId}`);
    console.log(`[Orchestrator] Model: gemini-2.5-flash`);

    // 5. Map our toolRegistry to the Vercel AI SDK format
    const tools: Record<string, any> = {};
    const toolNames = Object.keys(toolRegistry);
    console.log(`[Orchestrator] Registering tools: ${toolNames.join(', ')}`);

    toolNames.forEach((name) => {
      const definition = (toolRegistry as any)[name];
      tools[name] = tool({
        description: definition.description,
        parameters: definition.parameters,
        execute: async (params) => {
          console.log(`[Orchestrator] Tool Execute triggered: ${name}`);
          return await dispatchToolCall(name, params);
        },
      });
    });

    // 6. Execute AI call
    console.log('[Orchestrator] Calling streamText...');
    const result = streamText({
      model: google('gemini-2.5-flash'), // RESTORED MODEL
      system: systemPrompt, // Moved to proper 'system' field
      messages: promptMessages as any,
      tools,
      maxSteps: 5,
      onFinish: async ({ text }) => {
        console.log('[Orchestrator] Stream finished. Saving assistant response.');
        if (text) {
          await prisma.message.create({
            data: {
              conversationId: targetConversationId,
              role: 'ASSISTANT',
              content: text,
            },
          });
        }
      },
    });

    // 7. Manual Streaming to Express
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    console.log('[Orchestrator] Starting stream to client');
    try {
      for await (const textPart of result.textStream) {
        res.write(textPart);
      }
    } catch (streamError) {
      console.error('[Orchestrator] Error during text streaming:', streamError);
    }

    console.log('[Orchestrator] Stream ended');
    res.end();

  } catch (error: any) {
    console.error('[Orchestrator] Fatal Chat Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    } else {
      res.end();
    }
  }
});

export default router;
