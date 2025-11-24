import { z } from 'zod';

/**
 * Transcription Types
 * Defines schemas for medical transcription correction
 */

// Input schema for transcription correction
export const TranscriptionInputSchema = z.object({
  transcriptionText: z.string().describe('Raw medical transcription text with speaker labels'),
  context: z.string().optional().describe('Medical specialty or context (e.g., "cardiology", "general practice")'),
  preserveFormatting: z.boolean().optional().default(true).describe('Whether to preserve speaker labels and structure'),
});

export type TranscriptionInput = z.infer<typeof TranscriptionInputSchema>;

// Individual correction made to the transcription
export interface MedicalTermCorrection {
  original: string;
  corrected: string;
  position: number; // Character position in original text
  confidence: 'high' | 'medium' | 'low';
  category: 'medical_term' | 'drug_name' | 'procedure' | 'abbreviation' | 'spelling' | 'grammar';
  explanation?: string; // Why this correction was made
}

// Output schema for corrected transcription
export interface TranscriptionOutput {
  correctedText: string;
  corrections: MedicalTermCorrection[];
  summary: {
    totalCorrections: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
  };
  warnings?: string[]; // Any warnings or notes for the doctor
}

// Speaker line format
export interface SpeakerLine {
  speaker: string; // e.g., "speaker_01", "doctor", "patient"
  text: string;
  timestamp?: string;
}

// Medical term in knowledge base
export interface MedicalTerm {
  incorrect: string[]; // Common misspellings or incorrect forms
  correct: string;
  category: 'condition' | 'medication' | 'procedure' | 'anatomy' | 'abbreviation' | 'symptom';
  context?: string; // When to use this term
  explanation?: string;
}
