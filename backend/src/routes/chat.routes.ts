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

// POST /api/chat - AI Orchestrator with Multi-Step Debugging
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

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    let accumulatedResponse = '';

    // 2. Tool Mapping with Step-Level Debugging
    const tools: Record<string, any> = {};
    Object.entries(toolRegistry).forEach(([name, definition]) => {
      tools[name] = tool({
        description: definition.description,
        parameters: definition.parameters,
        execute: async (params) => {
          console.log(`[Tool] Starting: ${name}`);
          // Send visual feedback immediately
          const feedback = `\n\n> *Action: Using ${name.replace(/_/g, ' ')}...*\n\n`;
          res.write(feedback);
          accumulatedResponse += feedback;

          const result = await dispatchToolCall(name, params);
          console.log(`[Tool] Result for ${name}:`, JSON.stringify(result).substring(0, 50) + '...');
          return result;
        },
      });
    });

    // 3. Execution Loop with Explicit Multi-Step Logging
    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      messages: promptMessages as any,
      tools,
      maxSteps: 5,
      onStepFinish: ({ text, toolCalls, toolResults, finishReason }) => {
        console.log(`[Step Finish] Reason: ${finishReason}, Tools: ${toolCalls?.length || 0}, Text length: ${text?.length || 0}`);
        if (toolResults && toolResults.length > 0) {
          console.log(`[Step Finish] Results found: ${toolResults.length}`);
        }
      },
      onFinish: async ({ text }) => {
        const finalContent = accumulatedResponse + (text || '');
        console.log(`[Finish] Final text length: ${text?.length || 0}. Total accumulated: ${finalContent.length}`);
        
        if (finalContent.trim()) {
          await prisma.message.create({
            data: {
              conversationId: targetConversationId,
              role: 'ASSISTANT',
              content: finalContent,
            },
          });
          console.log('[Finish] Saved to DB.');
        }
      },
    });

    // 4. Stream consumption
    console.log('[Stream] Starting loop...');
    for await (const delta of result.textStream) {
      if (delta) {
        accumulatedResponse += delta;
        res.write(delta);
      }
    }

    console.log('[Stream] Loop ended.');
    res.end();

  } catch (error: any) {
    console.error('[Orchestrator] Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Internal Error' });
    else res.end();
  }
});

export default router;
