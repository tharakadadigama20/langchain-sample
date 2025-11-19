import { OpenAIEmbeddings } from '@langchain/openai';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { env } from '../config/env.js';
import type { Embeddings } from '@langchain/core/embeddings';

/**
 * Embedding Model Factory
 * Creates embedding models for vector store operations
 * 
 * Best Practice: 
 * - Use the same provider as your LLM for consistency
 * - OpenAI embeddings for OpenAI provider
 * - Google Generative AI embeddings for Gemini provider
 */
export function createEmbeddings(): Embeddings {
  const provider = env.MODEL_PROVIDER;

  if (provider === 'openai') {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required when using OpenAI provider');
    }

    return new OpenAIEmbeddings({
      openAIApiKey: env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small', // Cost-effective and performant
      batchSize: 512, // Process multiple documents at once
    });
  }

  if (provider === 'gemini') {
    if (!env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is required when using Gemini provider');
    }

    return new GoogleGenerativeAIEmbeddings({
      apiKey: env.GOOGLE_API_KEY,
      model: 'text-embedding-004', // Latest Gemini embedding model
    });
  }

  throw new Error(`Unsupported model provider: ${provider}`);
}

