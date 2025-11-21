/**
 * MBS Code Type Definitions
 */

export interface MBSCode {
  itemNumber: string;
  description: string;
  category: 'consultation' | 'chronic_disease' | 'health_assessment' | 'procedure' | 'mental_health' | 'after_hours';
  keywords: string[];
  typicalConditions: string[];
  fee: string;
  requirements?: string;
}

export interface MBSCodeSuggestion {
  code: MBSCode;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  relevanceScore: number;
}

export interface MBSCodeOutput {
  suggestions: MBSCodeSuggestion[];
  summary: {
    totalSuggestions: number;
    highConfidence: number;
    estimatedTotalFee: string;
  };
  warnings?: string[];
}
