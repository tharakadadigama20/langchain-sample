import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';
import { createEmbeddings } from '../models/embeddings.js';
import { medicalTermsDatabase } from '../data/medicalTerms.js';
import type { MedicalTerm } from '../types/transcription.js';

/**
 * Medical Terms Vector Store Service
 * 
 * Provides semantic search over medical terminology for context-aware
 * transcription correction using RAG (Retrieval Augmented Generation).
 * 
 * This service:
 * 1. Indexes medical terms with their corrections
 * 2. Performs semantic search to find relevant corrections
 * 3. Returns context for LLM-based correction
 */

class MedicalTermsVectorStore {
  private vectorStore: MemoryVectorStore | null = null;
  private isInitialized = false;

  /**
   * Initialize the vector store with medical terms
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️  Medical terms vector store already initialized');
      return;
    }

    console.log('🔄 Initializing medical terms vector store...');

    try {
      const embeddings = createEmbeddings();

      // Create documents from medical terms
      const documents = this.createDocuments(medicalTermsDatabase);

      console.log(`📄 Created ${documents.length} medical term documents`);

      // Create vector store
      this.vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);

      this.isInitialized = true;
      console.log(`✅ Medical terms vector store initialized with ${documents.length} terms`);
    } catch (error) {
      console.error('❌ Error initializing medical terms vector store:', error);
      throw error;
    }
  }

  /**
   * Create documents from medical terms for indexing
   */
  private createDocuments(terms: MedicalTerm[]): Document[] {
    const documents: Document[] = [];

    for (const term of terms) {
      // Create a document for each medical term
      // Include all incorrect forms and the correct form for better matching
      const content = `
Medical Term: ${term.correct}
Category: ${term.category}
Common Misspellings: ${term.incorrect.join(', ')}
${term.explanation ? `Explanation: ${term.explanation}` : ''}
${term.context ? `Context: ${term.context}` : ''}
      `.trim();

      documents.push(
        new Document({
          pageContent: content,
          metadata: {
            correct: term.correct,
            incorrect: term.incorrect,
            category: term.category,
            explanation: term.explanation || '',
            context: term.context || '',
          },
        })
      );
    }

    return documents;
  }

  /**
   * Search for relevant medical terms based on query
   * Returns terms that might need correction in the transcription
   */
  async searchRelevantTerms(
    query: string,
    limit: number = 10
  ): Promise<Array<{ term: MedicalTerm; score: number }>> {
    if (!this.isInitialized || !this.vectorStore) {
      await this.initialize();
    }

    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    try {
      // Perform similarity search
      const results = await this.vectorStore.similaritySearchWithScore(query, limit);

      // Convert results to medical terms with scores
      return results.map(([doc, score]) => ({
        term: {
          correct: doc.metadata.correct as string,
          incorrect: doc.metadata.incorrect as string[],
          category: doc.metadata.category as MedicalTerm['category'],
          explanation: doc.metadata.explanation as string | undefined,
          context: doc.metadata.context as string | undefined,
        },
        score: 1 - score, // Convert distance to similarity score
      }));
    } catch (error) {
      console.error('Error searching medical terms:', error);
      return [];
    }
  }

  /**
   * Get relevant medical terms for a specific category
   */
  async getTermsByCategory(
    category: MedicalTerm['category'],
    limit: number = 20
  ): Promise<MedicalTerm[]> {
    if (!this.isInitialized || !this.vectorStore) {
      await this.initialize();
    }

    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    try {
      // Search with category as query
      const results = await this.vectorStore.similaritySearch(category, limit);

      return results
        .filter((doc) => doc.metadata.category === category)
        .map((doc) => ({
          correct: doc.metadata.correct as string,
          incorrect: doc.metadata.incorrect as string[],
          category: doc.metadata.category as MedicalTerm['category'],
          explanation: doc.metadata.explanation as string | undefined,
          context: doc.metadata.context as string | undefined,
        }));
    } catch (error) {
      console.error('Error getting terms by category:', error);
      return [];
    }
  }

  /**
   * Format relevant terms for LLM prompt
   */
  async getContextForPrompt(transcriptionText: string, limit: number = 15): Promise<string> {
    const relevantTerms = await this.searchRelevantTerms(transcriptionText, limit);

    if (relevantTerms.length === 0) {
      return 'No specific medical terms found in context.';
    }

    const formattedTerms = relevantTerms
      .map(
        ({ term, score }) =>
          `- ${term.incorrect.join(', ')} → ${term.correct} (${term.category}, relevance: ${score.toFixed(2)})`
      )
      .join('\n');

    return `Relevant Medical Terms:\n${formattedTerms}`;
  }

  /**
   * Check if vector store is initialized
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get the underlying vector store (for advanced usage)
   */
  getVectorStore(): MemoryVectorStore | null {
    return this.vectorStore;
  }
}

// Export singleton instance
export const medicalTermsVectorStore = new MedicalTermsVectorStore();
