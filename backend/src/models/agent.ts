import { createLLM } from './llm.js';
import { tools } from '../tools/index.js';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { memory } from './memory.js';
import { env } from '../config/env.js';
import { HumanMessage, FunctionMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';

/**
 * Agent Factory
 * Creates a LangChain agent with tools and memory
 * Uses OpenAI Functions agent for OpenAI, and direct function calling for Gemini
 */
export async function createAgent(sessionId: string = 'default') {
  const llm = createLLM();
  const provider = env.MODEL_PROVIDER;
  
  if (provider === 'openai') {
    // Use OpenAI Functions agent for OpenAI
    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a helpful AI assistant with access to various tools.
Use tools when appropriate to help answer user questions accurately.
Always be concise and helpful.`,
      ],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ]);

    const agent = await createOpenAIFunctionsAgent({
      llm,
      tools,
      prompt,
    }) as any;

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: true,
      returnIntermediateSteps: false,
    }) as any;

    return {
      executor: agentExecutor,
      getHistory: () => memory.getLangChainMessages(sessionId),
      addMessage: (role: 'user' | 'assistant', content: string) => {
        memory.addMessage(sessionId, { role, content, timestamp: new Date() });
      },
    };
  } else {
    // For Gemini, use model directly without tools for now
    // TODO: Fix tool binding format for Gemini API
    // Gemini's API expects a different function declaration format than what LangChain provides
    
    return {
      executor: {
        invoke: async (input: { input: string; chat_history: BaseMessage[] }, options?: { callbacks?: any }) => {
          const messages = [
            ...input.chat_history,
            new HumanMessage(input.input),
          ];
          
          // Use invoke() with callbacks for streaming - this works better with Gemini
          // The callbacks will handle token streaming via handleLLMNewToken
          const response = await llm.invoke(messages, options);
          
          return {
            output: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
          };
        },
      },
      getHistory: () => memory.getLangChainMessages(sessionId),
      addMessage: (role: 'user' | 'assistant', content: string) => {
        memory.addMessage(sessionId, { role, content, timestamp: new Date() });
      },
    };
  }
}