# AI Agent - React + Fastify + LangChain

A full-stack AI agent application built with React, Fastify, and LangChain JS. Features streaming chat responses, tool calling, and support for multiple LLM providers (OpenAI and Google Gemini).

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository** (if applicable)

2. **Set up environment variables**

   Copy `.env.example` to `.env` in the root directory:
   ```bash
   cp .env.example .env
   ```

   Fill in your API keys:
   ```env
   OPENAI_API_KEY=your_openai_key_here
   GOOGLE_API_KEY=your_google_api_key_here
   ```

3. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

4. **Install frontend dependencies**

   ```bash
   cd ../frontend
   npm install
   ```

### Development

**Start the backend server:**

```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:3001`

**Start the frontend development server:**

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3000`

### Production Build

**Backend:**

```bash
cd backend
npm run build
npm start
```

**Frontend:**

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

## 📁 Project Structure

```
ai-agent/
├── backend/
│   ├── src/
│   │   ├── server.ts          # Fastify server setup
│   │   ├── config/
│   │   │   └── env.ts         # Environment configuration
│   │   ├── models/
│   │   │   ├── llm.ts         # LLM provider factory
│   │   │   ├── agent.ts       # LangChain agent setup
│   │   │   └── memory.ts      # Conversation memory
│   │   ├── tools/
│   │   │   ├── index.ts       # Tool registry
│   │   │   ├── webSearchTool.ts
│   │   │   ├── calculationTool.ts
│   │   │   └── customToolExample.ts
│   │   ├── routes/
│   │   │   └── chat.ts        # Chat API route
│   │   ├── utils/
│   │   │   └── stream.ts      # SSE streaming utilities
│   │   └── types/
│   │       └── chat.ts        # TypeScript types
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── InputBox.tsx
│   │   ├── hooks/
│   │   │   └── useChatStream.ts
│   │   └── lib/
│   │       └── sseClient.ts
│   ├── package.json
│   └── vite.config.ts
│
├── .env.example
└── README.md
```

## 🎯 Features

- **Streaming Chat**: Real-time token streaming via Server-Sent Events (SSE)
- **Tool Calling**: Dynamic tool execution (calculator, web search, custom tools)
- **Multi-Provider Support**: Switch between OpenAI and Google Gemini models
- **Conversation Memory**: Session-based conversation history
- **Modern UI**: Clean React interface with TailwindCSS
- **Type Safety**: Full TypeScript support

## 🔧 Configuration

### Model Provider

Set `MODEL_PROVIDER` in `.env` to switch between providers:

- `gemini` (default) - Uses Google Gemini API (free tier available)
- `openai` - Uses OpenAI API

### Adding New Tools

Create a new tool file in `backend/src/tools/` following the pattern:

```typescript
import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export const myTool = new StructuredTool({
  name: 'my_tool',
  description: 'Description of what the tool does',
  schema: z.object({
    // Define input schema
  }),
  async run({ /* inputs */ }) {
    // Tool implementation
    return 'Result';
  },
});
```

Then add it to `backend/src/tools/index.ts`:

```typescript
export const tools = [calculationTool, webSearchTool, myTool];
```

## 🚧 Future Enhancements

- [ ] RAG integration with vector stores
- [ ] Authentication and user sessions
- [ ] LangSmith tracing integration
- [ ] Web search API integration (Tavily, Serper)
- [ ] Additional tool integrations

## 📝 License

MIT

