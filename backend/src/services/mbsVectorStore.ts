import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { mbsCodesDatabase, formatMBSCodesForPrompt } from '../data/mbsCodes.js';
import type { MBSCode } from '../types/mbs.js';

/**
 * MBS Vector Store Service
 * 
 * Provides semantic search over MBS codes using RAG.
 * Similar to medicalTermsVectorStore but for billing codes.
 */
class MBSVectorStore {
  private vectorStore: MemoryVectorStore | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ MBS vector store already initialized');
      return;
    }

    try {
      console.log('🔄 Initializing MBS codes vector store...');

      const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GOOGLE_API_KEY,
        modelName: 'text-embedding-004',
      });

      // Create documents from MBS codes
      const documents = mbsCodesDatabase.map((code) => ({
        pageContent: `Item ${code.itemNumber}: ${code.description}. ${code.keywords.join(', ')}. Typical conditions: ${code.typicalConditions.join(', ')}`,
        metadata: {
          itemNumber: code.itemNumber,
          category: code.category,
          fee: code.fee,
        },
      }));

      this.vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
      this.isInitialized = true;

      console.log(`✅ MBS vector store initialized with ${mbsCodesDatabase.length} codes`);
    } catch (error) {
      console.error('❌ Error initializing MBS vector store:', error);
      throw error;
    }
  }

  async searchRelevantCodes(query: string, limit: number = 5): Promise<MBSCode[]> {
    if (!this.isInitialized || !this.vectorStore) {
      throw new Error('MBS vector store not initialized');
    }

    const results = await this.vectorStore.similaritySearch(query, limit);
    
    // Map results back to MBS codes
    return results
      .map((result) => {
        const itemNumber = result.metadata.itemNumber;
        return mbsCodesDatabase.find((code) => code.itemNumber === itemNumber);
      })
      .filter((code): code is MBSCode => code !== undefined);
  }

  async getContextForPrompt(query: string, limit: number = 10): Promise<string> {
    const relevantCodes = await this.searchRelevantCodes(query, limit);
    return formatMBSCodesForPrompt(relevantCodes);
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }
}

export const mbsVectorStore = new MBSVectorStore();
