import { DynamicStructuredTool } from '@langchain/core/tools';
import type { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLLM } from '../models/llm.js';
import { medicalTermsVectorStore } from '../services/medicalTermsVectorStore.js';
import { findCorrection } from '../data/medicalTerms.js';
import type { TranscriptionOutput, MedicalTermCorrection, SpeakerLine } from '../types/transcription.js';

/**
 * Medical Transcription Correction Tool
 * 
 * Corrects medical transcriptions using RAG + LLM approach:
 * 1. Parse transcription with speaker labels
 * 2. Use RAG to find relevant medical terms
 * 3. Use LLM to intelligently correct the transcription
 * 4. Track all changes with confidence scores
 * 5. Preserve speaker labels and formatting
 * 
 * Input format example:
 * speaker_01: "Patient has hyper tension and diabeetus"
 * speaker_02: "Ok, we'll prescribe metaformin"
 */

export const transcriptionCorrectionTool: StructuredTool = new (DynamicStructuredTool as any)({
  name: 'correct_medical_transcription',
  description: `Corrects medical transcriptions by fixing medical terminology, drug names, procedures, and spelling errors.
  
Use this tool when users provide medical transcription text that needs correction.

The tool will:
- Fix medical terminology and jargon
- Correct drug names and dosages
- Fix procedure names
- Preserve speaker labels and timestamps
- Track all changes made with confidence scores
- Provide a side-by-side comparison for doctor review

Input format should be dialog-style with speaker labels:
speaker_01: "text here"
speaker_02: "text here"

Or plain text without labels.`,

  schema: z.object({
    transcriptionText: z.string().describe('Raw medical transcription text to correct. Can include speaker labels like "speaker_01: text"'),
    context: z.string().optional().describe('Optional: Medical specialty or context (e.g., "cardiology", "general practice", "pediatrics")'),
    preserveFormatting: z.boolean().optional().describe('Whether to preserve speaker labels and line breaks (default: true)'),
  }),

  func: async (input: { transcriptionText: string; context?: string; preserveFormatting?: boolean }) => {
    const { transcriptionText, context, preserveFormatting = true } = input;

    try {
      // Validate input
      if (!transcriptionText || transcriptionText.trim().length === 0) {
        return JSON.stringify({
          error: 'Transcription text cannot be empty',
        });
      }

      // Ensure vector store is initialized
      if (!medicalTermsVectorStore.getIsInitialized()) {
        console.log('🔄 Initializing medical terms vector store...');
        await medicalTermsVectorStore.initialize();
      }

      // Step 1: Parse speaker lines if present
      const speakerLines = parseSpeakerLines(transcriptionText);
      const hasStructure = speakerLines.length > 0;

      // Step 2: Get relevant medical terms using RAG
      console.log('🔍 Searching for relevant medical terms...');
      const relevantTermsContext = await medicalTermsVectorStore.getContextForPrompt(
        transcriptionText,
        20 // Get top 20 relevant terms
      );

      // Step 3: Build specialized prompt for LLM
      const llm = createLLM();
      const correctionPrompt = buildCorrectionPrompt(
        transcriptionText,
        relevantTermsContext,
        context,
        preserveFormatting
      );

      console.log('🤖 Requesting LLM correction...');
      
      // Step 4: Get correction from LLM
      const response = await llm.invoke(correctionPrompt);
      
      // Extract content from response
      let correctedText = '';
      if (typeof response.content === 'string') {
        correctedText = response.content;
      } else if (Array.isArray(response.content)) {
        correctedText = response.content
          .map((item: any) => {
            if (typeof item === 'string') return item;
            if (item?.text) return item.text;
            return '';
          })
          .join(' ');
      }

      // Step 5: Identify corrections made
      const corrections = identifyCorrections(transcriptionText, correctedText);

      // Step 6: Build output with change tracking
      const output: TranscriptionOutput = {
        correctedText: correctedText.trim(),
        corrections,
        summary: {
          totalCorrections: corrections.length,
          highConfidence: corrections.filter((c) => c.confidence === 'high').length,
          mediumConfidence: corrections.filter((c) => c.confidence === 'medium').length,
          lowConfidence: corrections.filter((c) => c.confidence === 'low').length,
        },
        warnings: generateWarnings(corrections),
      };

      // Step 7: Format output for display
      return formatOutputForDisplay(output, transcriptionText);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Error correcting transcription:', errorMessage);
      return JSON.stringify({
        error: `Error correcting transcription: ${errorMessage}`,
      });
    }
  },
});

/**
 * Parse speaker lines from transcription
 */
function parseSpeakerLines(text: string): SpeakerLine[] {
  const lines = text.split('\n');
  const speakerLines: SpeakerLine[] = [];

  // Pattern: speaker_01: "text" or speaker_01: text
  const speakerPattern = /^(speaker_\d+|doctor|patient|dr|pt):\s*["']?(.+?)["']?$/i;

  for (const line of lines) {
    const match = line.trim().match(speakerPattern);
    if (match) {
      speakerLines.push({
        speaker: match[1],
        text: match[2].trim(),
      });
    }
  }

  return speakerLines;
}

/**
 * Build correction prompt for LLM
 */
function buildCorrectionPrompt(
  transcription: string,
  relevantTerms: string,
  context?: string,
  preserveFormatting?: boolean
): string {
  return `You are a medical transcription correction expert. Your task is to correct medical terminology, drug names, procedures, and spelling errors in the following transcription.

**IMPORTANT INSTRUCTIONS:**
1. Correct ONLY medical terms, drug names, procedures, and obvious spelling errors
2. Do NOT change the meaning or add new information
3. Preserve the original structure and speaker labels EXACTLY as they appear
4. Use proper medical terminology and correct spelling
5. Maintain the conversational tone
${context ? `6. This is a ${context} consultation - use appropriate terminology` : ''}

**Relevant Medical Terms for Reference:**
${relevantTerms}

**Original Transcription:**
${transcription}

**Your Task:**
Provide the corrected transcription below. ${preserveFormatting ? 'PRESERVE all speaker labels and line breaks EXACTLY.' : 'You may reformat for clarity.'}

**Corrected Transcription:**`;
}

/**
 * Identify corrections made between original and corrected text
 */
function identifyCorrections(original: string, corrected: string): MedicalTermCorrection[] {
  const corrections: MedicalTermCorrection[] = [];
  
  // Simple word-by-word comparison
  const originalWords = original.toLowerCase().split(/\s+/);
  const correctedWords = corrected.toLowerCase().split(/\s+/);
  
  // Find differences
  const originalText = original.toLowerCase();
  const correctedText = corrected.toLowerCase();
  
  // Check against known medical terms
  const words = original.split(/\b/);
  let position = 0;
  
  for (const word of words) {
    const cleanWord = word.trim().toLowerCase();
    if (cleanWord.length > 2) {
      // Check if this word has a known correction
      const medicalTerm = findCorrection(cleanWord);
      
      if (medicalTerm && !correctedText.includes(cleanWord)) {
        corrections.push({
          original: word.trim(),
          corrected: medicalTerm.correct,
          position,
          confidence: 'high',
          category: getCategoryFromMedicalTerm(medicalTerm.category),
          explanation: medicalTerm.explanation,
        });
      }
    }
    position += word.length;
  }
  
  // Also detect changes by comparing phrases
  detectPhraseChanges(original, corrected, corrections);
  
  return corrections;
}

/**
 * Detect phrase-level changes
 */
function detectPhraseChanges(
  original: string,
  corrected: string,
  corrections: MedicalTermCorrection[]
): void {
  // Common multi-word corrections
  const multiWordPatterns = [
    { pattern: /hyper\s+tension/gi, correct: 'hypertension', category: 'medical_term' as const },
    { pattern: /diabeetus|diabetis/gi, correct: 'diabetes', category: 'medical_term' as const },
    { pattern: /blood\s+pressure/gi, correct: 'blood pressure', category: 'medical_term' as const },
  ];

  for (const { pattern, correct, category } of multiWordPatterns) {
    const matches = original.matchAll(pattern);
    for (const match of matches) {
      if (match.index !== undefined && !corrected.toLowerCase().includes(match[0].toLowerCase())) {
        corrections.push({
          original: match[0],
          corrected: correct,
          position: match.index,
          confidence: 'high',
          category,
          explanation: `Multi-word correction: ${match[0]} → ${correct}`,
        });
      }
    }
  }
}

/**
 * Map medical term category to correction category
 */
function getCategoryFromMedicalTerm(
  category: string
): MedicalTermCorrection['category'] {
  const mapping: Record<string, MedicalTermCorrection['category']> = {
    condition: 'medical_term',
    medication: 'drug_name',
    procedure: 'procedure',
    anatomy: 'medical_term',
    abbreviation: 'abbreviation',
    symptom: 'medical_term',
  };
  return mapping[category] || 'medical_term';
}

/**
 * Generate warnings based on corrections
 */
function generateWarnings(corrections: MedicalTermCorrection[]): string[] {
  const warnings: string[] = [];

  const lowConfidenceCount = corrections.filter((c) => c.confidence === 'low').length;
  if (lowConfidenceCount > 0) {
    warnings.push(
      `${lowConfidenceCount} correction(s) have low confidence - please review carefully`
    );
  }

  const drugCorrections = corrections.filter((c) => c.category === 'drug_name').length;
  if (drugCorrections > 0) {
    warnings.push(
      `${drugCorrections} drug name(s) corrected - verify dosages and prescriptions`
    );
  }

  return warnings;
}

/**
 * Format output for display to user
 */
function formatOutputForDisplay(output: TranscriptionOutput, originalText: string): string {
  const { correctedText, corrections, summary, warnings } = output;

  let result = `## ✅ Transcription Corrected\n\n`;

  // Summary
  result += `**Summary:**\n`;
  result += `- Total corrections: ${summary.totalCorrections}\n`;
  result += `- High confidence: ${summary.highConfidence}\n`;
  result += `- Medium confidence: ${summary.mediumConfidence}\n`;
  result += `- Low confidence: ${summary.lowConfidence}\n\n`;

  // Warnings
  if (warnings && warnings.length > 0) {
    result += `**⚠️ Warnings:**\n`;
    warnings.forEach((warning) => {
      result += `- ${warning}\n`;
    });
    result += `\n`;
  }

  // Corrections list
  if (corrections.length > 0) {
    result += `**📝 Corrections Made:**\n`;
    corrections.forEach((correction, index) => {
      result += `${index + 1}. "${correction.original}" → "${correction.corrected}" (${correction.category}, ${correction.confidence} confidence)\n`;
      if (correction.explanation) {
        result += `   ℹ️ ${correction.explanation}\n`;
      }
    });
    result += `\n`;
  }

  // Side-by-side comparison
  result += `**📄 Original vs Corrected:**\n\n`;
  result += `**ORIGINAL:**\n\`\`\`\n${originalText}\n\`\`\`\n\n`;
  result += `**CORRECTED:**\n\`\`\`\n${correctedText}\n\`\`\`\n\n`;

  result += `---\n`;
  result += `💡 **Tip:** Review all corrections, especially those with low confidence or drug names.`;

  return result;
}
