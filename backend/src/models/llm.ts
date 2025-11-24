import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { env } from '../config/env.js';

/**
 * LLM Provider Factory
 * Supports OpenAI and Google Gemini models
 * Future: Can add more providers (Anthropic, etc.)
 */
export function createLLM() {
  const provider = env.MODEL_PROVIDER;

  if (provider === 'openai') {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required when using OpenAI provider');
    }

    return new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7,
      streaming: true,
      openAIApiKey: env.OPENAI_API_KEY,
    });
  }

  if (provider === 'gemini') {
    if (!env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is required when using Gemini provider');
    }

    return new ChatGoogleGenerativeAI({
      modelName: 'gemini-2.5-flash', // Use Gemini 2.5 models (1.5 models deprecated for new projects)
      temperature: 0.3, // Lower temperature for more consistent, complete responses
      streaming: true,
      maxOutputTokens: 2048, // Ensure sufficient tokens for complete responses
      apiKey: env.GOOGLE_API_KEY,
    });
  }

  throw new Error(`Unsupported model provider: ${provider}`);
}

