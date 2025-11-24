# Patient Data RAG System

This document explains the RAG (Retrieval Augmented Generation) system for querying patient data using natural language.

## Overview

The RAG system enables contextual query support for patient data. It uses:
- **Vector Store**: Semantic search over patient records
- **Embeddings**: OpenAI embeddings for document representation
- **Retrieval**: Similarity search with metadata filtering
- **Agent Integration**: Natural language queries via LangChain agent

## Architecture

### Components

1. **Mock Patient Data** (`src/data/mockPatients.ts`)
   - Realistic patient records with conditions, medications, and consultation notes
   - 5 sample patients with various medical conditions
   - Structured data following medical data best practices

2. **Vector Store Service** (`src/services/patientVectorStore.ts`)
   - Initializes vector store with patient data on server startup
   - Creates separate documents for:
     - Patient summaries
     - Consultation notes
     - Medications
     - Conditions
   - Includes metadata for filtering (patient ID, name, dates, etc.)

3. **Patient Query Tool** (`src/tools/patientQueryTool.ts`)
   - LangChain tool that performs semantic search
   - Handles natural language queries
   - Returns structured results with source citations
   - Supports metadata filtering

4. **Embedding Model** (`src/models/embeddings.ts`)
   - Uses provider-specific embeddings:
     - OpenAI embeddings for OpenAI provider
     - Google Generative AI embeddings (text-embedding-004) for Gemini provider
   - Supports batch processing for efficiency

## Usage Examples

### Example Queries

1. **Patient Information**
   ```
   "What medications is John Smith taking?"
   "Show me patient P001's conditions"
   "What is Mary Williams' last visit date?"
   ```

2. **Condition-Based Queries**
   ```
   "Find all patients with diabetes"
   "Who has hypertension?"
   "Show me diabetic patients seen this month"
   ```

3. **Medication Queries**
   ```
   "What patients are taking Metformin?"
   "List all medications for patient P001"
   ```

4. **Consultation Notes**
   ```
   "What was discussed in John Smith's last consultation?"
   "Show me consultation notes for patient P002"
   "What did Dr. Sarah Johnson note about patient P001?"
   ```

## How It Works

1. **Initialization** (on server startup):
   - Patient data is loaded from mock data
   - Each patient record is split into multiple documents:
     - Patient summary
     - Individual consultation notes
     - Individual medications
     - Individual conditions
   - Documents are embedded and stored in vector store

2. **Query Processing**:
   - User asks natural language question
   - Agent calls `query_patient_data` tool
   - Tool performs semantic search over vector store
   - Relevant documents are retrieved with relevance scores
   - Results are formatted with metadata and returned to agent
   - Agent synthesizes answer from retrieved context

3. **Metadata Filtering**:
   - Supports filtering by:
     - Patient ID
     - Patient name
     - Document type (summary, note, medication, condition)
     - Date ranges
     - Note types

## Best Practices Implemented

### 1. **Document Chunking Strategy**
   - Separate documents by type (patient info, notes, medications)
   - Each consultation note is a separate document
   - Preserves context and improves retrieval accuracy

### 2. **Metadata Enrichment**
   - Every document includes rich metadata:
     - Patient ID and name
     - Document type
     - Dates, doctors, conditions, medications
   - Enables filtering and better context understanding

### 3. **Source Citations**
   - Results include metadata showing:
     - Which patient the information is about
     - Document type and date
     - Relevance score
   - Helps agent provide accurate, traceable answers

### 4. **Error Handling**
   - Graceful handling of:
     - No results found
     - Missing patient data
     - Vector store initialization errors

### 5. **Scalability Considerations**
   - Uses MemoryVectorStore for development
   - Easy to swap to persistent stores (Qdrant, Pinecone, Supabase)
   - Batch processing for embeddings
   - Efficient similarity search

## Production Considerations

### Replace MemoryVectorStore

For production, replace `MemoryVectorStore` with:

```typescript
// Example: Using Qdrant
import { QdrantVectorStore } from '@langchain/community/vectorstores/qdrant';

// Example: Using Supabase
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
```

### Add Database Integration

Replace mock data with database queries:

```typescript
// Example: Load from database
const patients = await db.query('SELECT * FROM patients');
```

### Add Caching

Implement caching for frequently accessed patient data:

```typescript
// Example: Redis caching
import Redis from 'ioredis';
const redis = new Redis();
```

### Add Authentication & Authorization

Ensure proper access control:

```typescript
// Example: Check user permissions
if (!hasAccess(userId, patientId)) {
  throw new Error('Unauthorized');
}
```

## Testing the System

1. **Start the server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Query examples** (via chat interface):
   - "What medications is John Smith taking?"
   - "Find all diabetic patients"
   - "What was discussed in patient P001's last visit?"
   - "Show me patients with hypertension"

3. **Check logs**:
   - Vector store initialization messages
   - Tool call logs
   - Retrieval results

## Future Enhancements

- [ ] Add hybrid search (keyword + semantic)
- [ ] Implement re-ranking for better results
- [ ] Add query expansion
- [ ] Support complex queries (AND/OR logic)
- [ ] Add query result caching
- [ ] Implement incremental updates (add new patients without full reindex)
- [ ] Add query analytics and monitoring

## Files Structure

```
backend/src/
├── data/
│   └── mockPatients.ts          # Mock patient data
├── models/
│   └── embeddings.ts             # Embedding model factory
├── services/
│   └── patientVectorStore.ts    # Vector store service
├── tools/
│   └── patientQueryTool.ts      # RAG query tool
└── types/
    └── patient.ts               # Patient data types
```

## Dependencies

- `@langchain/openai` - OpenAI embeddings
- `langchain` - Vector stores and core functionality
- `@langchain/core` - Core LangChain types

## Notes

- Embeddings use provider-specific APIs:
  - OpenAI provider: Requires `OPENAI_API_KEY`
  - Gemini provider: Requires `GOOGLE_API_KEY` (uses text-embedding-004)
- Vector store is in-memory (resets on server restart)
- Mock data includes 5 sample patients
- All patient data is synthetic and for training purposes only

