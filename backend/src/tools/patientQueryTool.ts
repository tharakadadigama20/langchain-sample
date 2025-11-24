import { DynamicStructuredTool } from '@langchain/core/tools';
import type { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { patientVectorStore } from '../services/patientVectorStore.js';
import { getPatientById, getPatientByName } from '../data/mockPatients.js';
import type { PatientQueryContext } from '../types/patient.js';

/**
 * Metadata filters type for patient vector store search
 * Explicitly defined to prevent deep type instantiation
 */
type MetadataFilters = {
  patientId?: string;
  patientName?: string;
  type?: string;
  noteType?: string;
  dateRange?: { start: string; end: string };
};

/**
 * Patient Query Tool
 * 
 * Uses RAG (Retrieval Augmented Generation) to answer natural language queries
 * about patient data. This tool:
 * 1. Performs semantic search over patient records
 * 2. Retrieves relevant context
 * 3. Returns structured information for the agent to synthesize
 * 
 * Best Practices:
 * - Separate retrieval from generation
 * - Include source citations (metadata)
 * - Handle edge cases gracefully
 * - Provide structured output for agent processing
 */
// Type instantiation depth issue with LangChain generics - using type assertion to bypass
// This is a known limitation when using complex Zod schemas with DynamicStructuredTool
// The tool works correctly at runtime despite the TypeScript error
export const patientQueryTool: StructuredTool = new (DynamicStructuredTool as any)({
  name: 'query_patient_data',
  description: `Query patient records, consultation notes, medications, and conditions using natural language.
  
Use this tool when users ask about:
- Patient information (demographics, conditions, medications)
- Consultation notes and visit history
- Medication lists and dosages
- Medical conditions and diagnoses
- Visit dates and appointment information

Examples of queries:
- "What medications is John Smith taking?"
- "Show me all diabetic patients"
- "What was discussed in patient P001's last visit?"
- "Find patients with hypertension seen this month"
- "What conditions does Mary Williams have?"`,

  schema: z.object({
    query: z.string().describe(
      'Natural language query about patient data. Be specific and include patient names or IDs when available.'
    ),
    patientId: z.string().optional().describe('Optional: Specific patient ID to filter results (e.g., P001)'),
    patientName: z.string().optional().describe('Optional: Patient name to filter results (e.g., "John Smith" or "John")'),
    limit: z.number().optional().describe('Maximum number of results to return (1-20, default: 5)'),
  }),

  func: async (input: { query: string; patientId?: string; patientName?: string; limit?: number }) => {
    // Validate and sanitize limit
    let limit = input.limit ?? 5;
    if (limit < 1) limit = 1;
    if (limit > 20) limit = 20;
    limit = Math.floor(limit);
    
    const { query, patientId, patientName } = input;
    try {
      // Ensure vector store is initialized
      if (!patientVectorStore.getIsInitialized()) {
        await patientVectorStore.initialize();
      }

      // Build metadata filters
      const metadataFilters: MetadataFilters = {};
      
      if (patientId) {
        metadataFilters.patientId = patientId;
      }
      
      if (patientName) {
        metadataFilters.patientName = patientName;
      }

      // Perform semantic search
      const searchResults = await patientVectorStore.searchWithMetadata(
        query,
        metadataFilters,
        limit
      );

      if (searchResults.length === 0) {
        return `No patient data found matching the query: "${query}". 
        
Try:
- Using patient names or IDs (e.g., "John Smith" or "P001")
- Being more specific about what information you need
- Checking if the patient exists in the system`;
      }

      // Format results for the agent
      const formattedResults = searchResults.map((result, index) => {
        const { content, metadata, relevanceScore } = result;
        return `
[Result ${index + 1}] (Relevance: ${(1 - relevanceScore).toFixed(2)})
Type: ${metadata.type}
Patient: ${metadata.patientName} (ID: ${metadata.patientId})
${metadata.date ? `Date: ${metadata.date}` : ''}
${metadata.doctor ? `Doctor: ${metadata.doctor}` : ''}
${metadata.noteType ? `Note Type: ${metadata.noteType}` : ''}
${metadata.conditionName ? `Condition: ${metadata.conditionName}` : ''}
${metadata.medicationName ? `Medication: ${metadata.medicationName} (${metadata.dosage}, ${metadata.frequency})` : ''}
Content: ${content}
---`;
      }).join('\n');

      // If patient ID or name was provided, also try direct lookup
      let directPatientInfo = '';
      if (patientId) {
        const patient = getPatientById(patientId);
        if (patient) {
          // Format conditions as separate lines
          const conditionsList = patient.conditions
            .map((c, i) => `  ${i + 1}. ${c.name} (ICD-10: ${c.icd10Code}, Status: ${c.status}, Diagnosed: ${c.diagnosedDate})`)
            .join('\n');
          
          // Format medications as separate lines with full details
          const medicationsList = patient.medications
            .map((m, i) => `  ${i + 1}. ${m.name} - ${m.dosage}, ${m.frequency} (Started: ${m.startDate}, Prescribed by: ${m.prescribingDoctor})`)
            .join('\n');
          
          directPatientInfo = `\n\n=== DIRECT PATIENT LOOKUP (${patientId}) ===
Name: ${patient.firstName} ${patient.lastName}
Age: ${patient.age}, Gender: ${patient.gender}
MRN: ${patient.mrn || 'N/A'}

CONDITIONS (${patient.conditions.length} total):
${conditionsList}

MEDICATIONS (${patient.medications.length} total):
${medicationsList}

Last Visit: ${patient.lastVisitDate || 'N/A'}
Next Appointment: ${patient.nextAppointment || 'N/A'}
=== END PATIENT LOOKUP ===`;
        }

      } else if (patientName) {
        const nameParts = patientName.trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;
        const patients = getPatientByName(firstName, lastName);
        
        if (patients.length > 0) {
          directPatientInfo = `\n\nDirect Patient Lookup (${patientName}):`;
          patients.forEach((patient) => {
            directPatientInfo += `
- ${patient.firstName} ${patient.lastName} (ID: ${patient.id}, MRN: ${patient.mrn})
  Age: ${patient.age}, Conditions: ${patient.conditions.map((c) => c.name).join(', ')}`;
          });
        }
      }

      return `Found ${searchResults.length} relevant result(s) for query: "${query}"
${formattedResults}
${directPatientInfo}

Note: Use this information to provide a comprehensive answer to the user's question.`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return `Error querying patient data: ${errorMessage}. Please try again or rephrase your query.`;
    }
  },
});

