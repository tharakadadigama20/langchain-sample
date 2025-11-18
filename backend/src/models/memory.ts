import type { ChatMessage } from '../types/chat.js';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

/**
 * Simple in-memory buffer for conversation history
 * Future: Can be replaced with Redis, database, or vector store
 */
export class BufferMemory {
  private sessions: Map<string, ChatMessage[]> = new Map();

  /**
   * Get conversation history for a session
   */
  getHistory(sessionId: string = 'default'): ChatMessage[] {
    return this.sessions.get(sessionId) || [];
  }

  /**
   * Add a message to the conversation history
   */
  addMessage(sessionId: string, message: ChatMessage): void {
    const history = this.getHistory(sessionId);
    history.push(message);
    this.sessions.set(sessionId, history);
  }

  /**
   * Clear conversation history for a session
   */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Get all messages formatted for LangChain
   */
  getLangChainMessages(sessionId: string = 'default') {
    return this.getHistory(sessionId).map((msg) => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content);
      } else if (msg.role === 'assistant') {
        return new AIMessage(msg.content);
      } else {
        return new SystemMessage(msg.content);
      }
    });
  }
}

export const memory = new BufferMemory();

