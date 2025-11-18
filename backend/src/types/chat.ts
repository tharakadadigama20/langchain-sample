import { z } from 'zod';

export const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  sessionId: z.string().optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface StreamEvent {
  type: 'token' | 'tool_call' | 'tool_result' | 'error' | 'done';
  data: string | Record<string, unknown>;
}

