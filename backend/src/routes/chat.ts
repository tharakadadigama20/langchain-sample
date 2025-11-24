import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ChatRequestSchema } from '../types/chat.js';
import { createAgent } from '../models/agent.js';
import { sendToken, sendError, sendDone, sendToolCall, sendToolResult } from '../utils/stream.js';
import { CallbackManager } from '@langchain/core/callbacks/manager';
import { env } from '../config/env.js';

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

      // Track if tokens were streamed
      let tokensStreamed = false;
      let streamedContent = '';

      // Create callback manager for streaming
      const callbackManager = CallbackManager.fromHandlers({
        async handleLLMNewToken(token: string) {
          console.log('[Stream] Token:', token);
          tokensStreamed = true;
          streamedContent += token;
          sendToken(reply, token);
        },
        async handleToolStart(tool: any, input: string) {
          const toolName = tool?.name || (typeof tool === 'string' ? tool : 'unknown');
          console.log('[Stream] Tool Start:', toolName, JSON.stringify(input).substring(0, 200));
          sendToolCall(reply, toolName, input);
        },
        async handleToolEnd(output: string) {
          console.log('[Stream] Tool End:', output?.substring(0, 200));
          sendToolResult(reply, output);
        },
        async handleLLMStart(llm: any, prompts: string[]) {
          console.log('[Stream] LLM Start');
        },
        async handleLLMEnd(output: any) {
          const text = output?.generations?.[0]?.[0]?.text;
          console.log('[Stream] LLM End:', text?.substring(0, 200));
        },
        async handleChainStart(chain: any, inputs: any) {
          console.log('[Stream] Chain Start:', chain?.name || 'unknown');
        },
        async handleChainEnd(output: any) {
          const outputStr = typeof output?.output === 'string' 
            ? output.output.substring(0, 200)
            : JSON.stringify(output?.output || output).substring(0, 200);
          console.log('[Stream] Chain End:', outputStr);
        },
      });

      // Use invoke with callbacks for streaming (works better with tool calling agents)
      console.log('[Chat] Invoking agent with message:', message);
      
      const response = await agent.executor.invoke(
        {
          input: message,
          chat_history: agent.getHistory(),
        },
        {
          callbacks: callbackManager,
        }
      );

      console.log('[Chat] Agent response:', JSON.stringify(response, null, 2));
      console.log('[Chat] Response output:', response.output);
      console.log('[Chat] Tokens streamed:', tokensStreamed);
      console.log('[Chat] Streamed content:', streamedContent);

      // Determine final response
      let finalResponse = '';
      
      // Check if response.output is a string (final answer) or array (tool call decision)
      const outputIsString = typeof response.output === 'string';
      const outputIsArray = Array.isArray(response.output);
      const outputHasToolCall = outputIsArray && response.output.some((item: any) => item.functionCall);
      
      console.log('[Chat] Output is string:', outputIsString);
      console.log('[Chat] Output is array:', outputIsArray);
      console.log('[Chat] Output has tool call:', outputHasToolCall);
      
      if (tokensStreamed && streamedContent.trim()) {
        // Tokens were streamed, use streamed content
        finalResponse = streamedContent;
      } else if (outputIsString && response.output.trim()) {
        // String output - use it directly
        finalResponse = response.output;
        if (!tokensStreamed) {
          console.log('[Chat] Sending string response as tokens');
          sendToken(reply, finalResponse);
        }
      } else if (outputHasToolCall) {
        // Tool was called but executor didn't complete - this shouldn't happen
        // But if it does, provide a helpful message
        const toolCall = response.output.find((item: any) => item.functionCall);
        console.error('[Chat] ERROR: Tool was called but executor stopped:', toolCall);
        finalResponse = 'I attempted to query patient data, but encountered an issue. Please try again.';
        sendToken(reply, finalResponse);
      } else if (response.output) {
        // Other output format - stringify it
        finalResponse = JSON.stringify(response.output);
        if (!tokensStreamed) {
          console.log('[Chat] Sending JSON response as tokens');
          sendToken(reply, finalResponse);
        }
      }

      // Add assistant response to memory
      if (finalResponse) {
        agent.addMessage('assistant', finalResponse);
      } else {
        console.error('[Chat] WARNING: No final response generated!');
        const errorMsg = 'I apologize, but I encountered an issue processing your request. Please try again.';
        sendToken(reply, errorMsg);
        agent.addMessage('assistant', errorMsg);
      }

      // Send completion event
      sendDone(reply);
    } catch (error) {
      console.error('Chat error:', error);
      sendError(reply, error instanceof Error ? error.message : 'Unknown error occurred');
      sendDone(reply);
    }
  });
}

