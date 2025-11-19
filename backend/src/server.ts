import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env.js';
import { chatRoute } from './routes/chat.js';
import { patientVectorStore } from './services/patientVectorStore.js';

/**
 * Fastify Server Setup
 */
const server = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

// Register plugins
await server.register(cors, {
  origin: true,
  credentials: true,
});

// Register routes
await server.register(chatRoute);

// Health check endpoint
server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    // Initialize patient vector store (RAG system)
    console.log('🔄 Initializing RAG system...');
    await patientVectorStore.initialize();
    console.log('✅ RAG system ready');

    const port = Number(env.PORT);
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📝 Environment: ${env.NODE_ENV}`);
    console.log(`🤖 Model Provider: ${env.MODEL_PROVIDER}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

