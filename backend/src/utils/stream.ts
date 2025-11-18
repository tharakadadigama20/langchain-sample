import type { FastifyReply } from 'fastify';

/**
 * SSE Stream Utilities
 * Helper functions for sending Server-Sent Events
 */
export function sendSSE(reply: FastifyReply, event: string, data: string | object) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  reply.raw.write(`event: ${event}\ndata: ${payload}\n\n`);
}

export function sendToken(reply: FastifyReply, token: string) {
  sendSSE(reply, 'token', token);
}

export function sendToolCall(reply: FastifyReply, toolName: string, input: unknown) {
  sendSSE(reply, 'tool_call', { tool: toolName, input });
}

export function sendToolResult(reply: FastifyReply, result: string) {
  sendSSE(reply, 'tool_result', result);
}

export function sendError(reply: FastifyReply, error: string) {
  sendSSE(reply, 'error', { error });
}

export function sendDone(reply: FastifyReply) {
  sendSSE(reply, 'done', {});
  reply.raw.end();
}

