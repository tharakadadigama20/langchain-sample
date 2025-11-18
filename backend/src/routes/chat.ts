import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ChatRequestSchema } from '../types/chat.js';
import { createAgent } from '../models/agent.js';
import { sendToken, sendError, sendDone, sendToolCall, sendToolResult } from '../utils/stream.js';
import { CallbackManager } from '@langchain/core/callbacks/manager';

/**
 * Chat route handler
 * POST /api/chat
 * Streams AI agent responses via SSE
 */
export async function chatRoute(fastify: FastifyInstance) {
  fastify.post('/api/chat', async (request: FastifyRequest, reply: FastifyReply) => {
    // Validate request body
    const validationResult = ChatRequestSchema.safeParse(request.body);
    
    if (!validationResult.success) {
      return reply.code(400).send({
        error: 'Invalid request',
        details: validationResult.error.errors,
      });
    }

    const { message, sessionId = 'default' } = validationResult.data;

    // Set up SSE headers
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');

    try {
      // Create agent for this session
      const agent = await createAgent(sessionId);

      // Add user message to memory
      agent.addMessage('user', message);

      // Create callback manager for streaming
      const callbackManager = CallbackManager.fromHandlers({
        async handleLLMNewToken(token: string) {
          sendToken(reply, token);
        },
        async handleToolStart(tool: any, input: string) {
          const toolName = tool?.name || (typeof tool === 'string' ? tool : 'unknown');
          sendToolCall(reply, toolName, input);
        },
        async handleToolEnd(output: string) {
          sendToolResult(reply, output);
        },
      });

      // Stream the agent response
      const response = await agent.executor.invoke(
        {
          input: message,
          chat_history: agent.getHistory(),
        },
        {
          callbacks: callbackManager,
        }
      );

      // Add assistant response to memory
      agent.addMessage('assistant', response.output);

      // Send completion event
      sendDone(reply);
    } catch (error) {
      console.error('Chat error:', error);
      sendError(reply, error instanceof Error ? error.message : 'Unknown error occurred');
      sendDone(reply);
    }
  });
}

