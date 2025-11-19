import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';
import { createEmbeddings } from '../models/embeddings.js';
import { mockPatients, getAllPatients } from '../data/mockPatients.js';
import type { Patient, ConsultationNote } from '../types/patient.js';

/**
 * Patient Vector Store Service
 * 
 * Best Practices for Large AI Systems:
 * 1. Separate documents by type (patient info, notes, etc.)
 * 2. Include metadata for filtering
 * 3. Use chunking strategies for long documents
 * 4. Implement proper indexing and retrieval
 * 
 * In production, replace MemoryVectorStore with:
 * - Qdrant, Pinecone, or Supabase for persistence
 * - Redis for caching
 * - Proper indexing strategies
 */
class PatientVectorStoreService {
  private vectorStore: MemoryVectorStore | null = null;
  private isInitialized = false;

  /**
   * Initialize vector store with patient data
   * Should be called on server startup
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🔄 Initializing patient vector store...');
    const embeddings = createEmbeddings();
    const documents: Document[] = [];

    // Process all patients and their consultation notes
    for (const patient of getAllPatients()) {
      // Create document for patient summary
      documents.push(
        new Document({
          pageContent: this.createPatientSummaryText(patient),
          metadata: {
            type: 'patient_summary',
            patientId: patient.id,
            patientName: `${patient.firstName} ${patient.lastName}`,
            mrn: patient.mrn,
            age: patient.age,
            gender: patient.gender,
            conditions: patient.conditions.map((c) => c.name).join(', '),
            medications: patient.medications.map((m) => m.name).join(', '),
          },
        })
      );

      // Create separate documents for each consultation note
      for (const note of patient.consultationNotes) {
        documents.push(
          new Document({
            pageContent: this.createNoteText(patient, note),
            metadata: {
              type: 'consultation_note',
              patientId: patient.id,
              patientName: `${patient.firstName} ${patient.lastName}`,
              noteId: note.id,
              date: note.date,
              doctor: note.doctor,
              noteType: note.noteType,
              conditions: patient.conditions.map((c) => c.name).join(', '),
            },
          })
        );
      }

      // Create documents for medications
      for (const medication of patient.medications) {
        documents.push(
          new Document({
            pageContent: this.createMedicationText(patient, medication),
            metadata: {
              type: 'medication',
              patientId: patient.id,
              patientName: `${patient.firstName} ${patient.lastName}`,
              medicationName: medication.name,
              dosage: medication.dosage,
              frequency: medication.frequency,
            },
          })
        );
      }

      // Create documents for conditions
      for (const condition of patient.conditions) {
        documents.push(
          new Document({
            pageContent: this.createConditionText(patient, condition),
            metadata: {
              type: 'condition',
              patientId: patient.id,
              patientName: `${patient.firstName} ${patient.lastName}`,
              conditionName: condition.name,
              icd10Code: condition.icd10Code,
              status: condition.status,
            },
          })
        );
      }
    }

    // Create vector store with all documents
    this.vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
    this.isInitialized = true;
    console.log(`✅ Patient vector store initialized with ${documents.length} documents`);
  }

  /**
   * Search patient data using semantic search
   * 
   * @param query - Natural language query
   * @param options - Search options (filters, limit, etc.)
   */
  async search(
    query: string,
    options: {
      limit?: number;
      filter?: (metadata: Record<string, unknown>) => boolean;
    } = {}
  ) {
    if (!this.vectorStore || !this.isInitialized) {
      throw new Error('Vector store not initialized. Call initialize() first.');
    }

    const { limit = 5, filter } = options;

    // Perform similarity search
    const results = await this.vectorStore.similaritySearchWithScore(query, limit);

    // Apply metadata filters if provided
    let filteredResults = results;
    if (filter) {
      filteredResults = results.filter(([doc]) => filter(doc.metadata));
    }

    return filteredResults.map(([doc, score]) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      relevanceScore: score,
    }));
  }

  /**
   * Search with metadata filters
   * Useful for filtering by patient ID, date range, etc.
   */
  async searchWithMetadata(
    query: string,
    metadataFilters: {
      patientId?: string;
      patientName?: string;
      type?: string;
      noteType?: string;
      dateRange?: { start: string; end: string };
    },
    limit = 5
  ) {
    const filter = (metadata: Record<string, unknown>): boolean => {
      if (metadataFilters.patientId && metadata.patientId !== metadataFilters.patientId) {
        return false;
      }
      if (metadataFilters.patientName && !String(metadata.patientName).includes(metadataFilters.patientName)) {
        return false;
      }
      if (metadataFilters.type && metadata.type !== metadataFilters.type) {
        return false;
      }
      if (metadataFilters.noteType && metadata.noteType !== metadataFilters.noteType) {
        return false;
      }
      if (metadataFilters.dateRange && metadata.date) {
        const noteDate = String(metadata.date);
        if (
          noteDate < metadataFilters.dateRange.start ||
          noteDate > metadataFilters.dateRange.end
        ) {
          return false;
        }
      }
      return true;
    };

    return this.search(query, { limit, filter });
  }

  /**
   * Helper: Create patient summary text for embedding
   */
  private createPatientSummaryText(patient: Patient): string {
    const conditions = patient.conditions.map((c) => c.name).join(', ');
    const medications = patient.medications.map((m) => `${m.name} (${m.dosage})`).join(', ');
    
    return `Patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.id}, MRN: ${patient.mrn}). 
Age: ${patient.age}, Gender: ${patient.gender}. 
Conditions: ${conditions}. 
Current Medications: ${medications}. 
Last Visit: ${patient.lastVisitDate || 'N/A'}. 
Next Appointment: ${patient.nextAppointment || 'N/A'}.`;
  }

  /**
   * Helper: Create consultation note text for embedding
   */
  private createNoteText(patient: Patient, note: ConsultationNote): string {
    return `Consultation Note for ${patient.firstName} ${patient.lastName} (${patient.id}).
Date: ${note.date}. Doctor: ${note.doctor}. Type: ${note.noteType}.
${note.fullText}`;
  }

  /**
   * Helper: Create medication text for embedding
   */
  private createMedicationText(patient: Patient, medication: Patient['medications'][0]): string {
    return `Patient ${patient.firstName} ${patient.lastName} (${patient.id}) is prescribed ${medication.name} ${medication.dosage} ${medication.frequency}. 
Prescribed by ${medication.prescribingDoctor || 'Unknown'}. 
Start Date: ${medication.startDate || 'Unknown'}.`;
  }

  /**
   * Helper: Create condition text for embedding
   */
  private createConditionText(patient: Patient, condition: Patient['conditions'][0]): string {
    return `Patient ${patient.firstName} ${patient.lastName} (${patient.id}) has ${condition.name} (ICD-10: ${condition.icd10Code || 'N/A'}). 
Status: ${condition.status}. 
Diagnosed: ${condition.diagnosedDate || 'Unknown'}.`;
  }

  /**
   * Get vector store instance (for advanced usage)
   */
  getVectorStore(): MemoryVectorStore | null {
    return this.vectorStore;
  }

  /**
   * Check if initialized
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
export const patientVectorStore = new PatientVectorStoreService();

