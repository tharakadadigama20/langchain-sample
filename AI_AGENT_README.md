# AI Agent Starter – React + Fastify + LangChain (JS)

This document defines the **architecture, requirements, folder structure, and implementation specification** for building a production-ready **AI Agent** using:

- **LangChain JS**
- **Fastify backend** (Node.js)
- **React frontend**
- **SSE streaming**
- **Groq + OpenAI models**
- **Modular tool system**

RAG is **not implemented** at this stage, but the architecture is **fully prepared** for adding a vector store later.

This README should guide Cursor to generate a clean, production-ready implementation that follows modern best practices.

---

# 📦 Project Overview
A full-stack AI agent application built with:

### **Frontend (React)**
- Chat UI with streaming token updates
- TailwindCSS + shadcn/ui
- Hooks for SSE stream handling
- Message history stored in local state (or optional backend session)

### **Backend (Fastify)**
- LangChain agent orchestrator
- Tool registry (Structured Tools)
- Groq + OpenAI model wrapper
- Streaming via SSE
- Zod validation for all requests
- Environment-based model switching

### **Agent Features**
- Dynamic tool calling
- Deterministic structured outputs
- Supports future RAG integration
- Configurable memory provider (simple buffer initially)
- Debug-ready (LangSmith optional)

---

# 🏗️ Tech Stack

## **Frontend**
- React (Vite recommended)
- TailwindCSS
- shadcn/ui
- Zustand (optional) for global store
- SSE streaming handler

## **Backend**
- Node.js
- Fastify
- LangChain JS + LangGraph (optional)
- @langchain/openai
- groq-sdk
- Zod for validation
- fastify-sse-v2

## **Optional Integrations**
- LangSmith (debugging & tracing)
- RAG (Supabase / Pinecone / Qdrant)
- Authentication (Clerk / Auth0)

---

# 📁 Folder Structure
Below is the required folder structure.

```
ai-agent/
│
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── config/env.ts
│   │   ├── models/
│   │   │   ├── llm.ts
│   │   │   ├── agent.ts
│   │   │   └── memory.ts
│   │   ├── tools/
│   │   │   ├── index.ts
│   │   │   ├── webSearchTool.ts
│   │   │   ├── calculationTool.ts
│   │   │   └── customToolExample.ts
│   │   ├── routes/
│   │   │   └── chat.ts
│   │   ├── utils/
│   │   │   └── stream.ts
│   │   └── types/
│   │       └── chat.ts
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
│   │   └── lib/sseClient.ts
│   ├── index.html
│   ├── package.json
│   └── tailwind.config.js
│
├── .env.example
└── README.md
```

---

# 🔑 Environment Variables
```
OPENAI_API_KEY=
GROQ_API_KEY=

LANGCHAIN_TRACING_V2=
LANGCHAIN_API_KEY=
LANGCHAIN_PROJECT=
```

---

# 🧠 Agent Architecture
The agent follows a **tool-enabled reasoning loop**.

### **Components**
- LLM Provider (Groq or OpenAI)
- Tools (Zod-validated StructuredTools)
- Memory (simple buffer)
- Agent Executor (LangChain)
- SSE Stream Emitter

### **Tool Design Standard**
```
export const ExampleTool = new StructuredTool({
  name: "example_tool",
  description: "Explain what this tool does.",
  schema: z.object({ query: z.string() }),
  async run({ query }) {
    return `Processed: ${query}`;
  }
});
```

---

# 🔗 Fastify Route Specification (`/api/chat`)
POST /api/chat

### Input:
{
  "message": "Hello",
  "sessionId": "optional"
}

### Output:
SSE stream of tokens

---

# 🌐 Frontend Specification
- Chat interface UI
- SSE hook for streaming
- Tailwind + shadcn
- Message auto-scroll

---

# 🎯 Functional Requirements
Backend:
- Validate requests with Zod
- Stream responses
- Log tool calls
- Send structured errors

Frontend:
- Prevent empty messages
- Show typing indicator

---

# 🚀 Future-Ready
Leave placeholders for RAG, vector store, embeddings.

---

# 🧪 Dev Commands

Frontend:
npm install
npm run dev

Backend:
npm install
npm run dev

---

# 🔥 Production

Frontend:
npm run build

Backend:
npm run build
npm start

---

# 📌 Notes for Cursor
- Follow folder structure strictly
- All code in TypeScript
- Modular architecture
- No API keys in frontend
