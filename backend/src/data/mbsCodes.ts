import type { MBSCode } from '../types/mbs.js';

/**
 * MBS (Medicare Benefits Schedule) Code Database
 * 
 * Sample database of common MBS billing codes for demonstration.
 * In production, this would be replaced with a comprehensive API or database.
 */

export const mbsCodesDatabase: MBSCode[] = [
  // Consultations
  {
    itemNumber: '23',
    description: 'Level A consultation - Less than 20 minutes',
    category: 'consultation',
    keywords: ['brief', 'short', 'quick', 'simple', 'minor'],
    typicalConditions: ['minor illness', 'prescription refill', 'simple follow-up'],
    fee: '$39.75',
  },
  {
    itemNumber: '36',
    description: 'Level B consultation - At least 20 minutes',
    category: 'consultation',
    keywords: ['standard', 'routine', 'follow-up', 'review', 'check-up'],
    typicalConditions: ['hypertension review', 'diabetes check', 'general consultation'],
    fee: '$75.25',
  },
  {
    itemNumber: '44',
    description: 'Level C consultation - At least 40 minutes',
    category: 'consultation',
    keywords: ['complex', 'detailed', 'comprehensive', 'multiple issues'],
    typicalConditions: ['multiple chronic conditions', 'complex case', 'detailed assessment'],
    fee: '$109.90',
  },
  {
    itemNumber: '52',
    description: 'Level D consultation - At least 60 minutes',
    category: 'consultation',
    keywords: ['extended', 'lengthy', 'very complex', 'multiple conditions'],
    typicalConditions: ['very complex case', 'multiple serious conditions'],
    fee: '$154.70',
  },

  // Chronic Disease Management
  {
    itemNumber: '721',
    description: 'Chronic Disease GP Management Plan',
    category: 'chronic_disease',
    keywords: ['management plan', 'chronic disease', 'ongoing care', 'care plan'],
    typicalConditions: ['diabetes', 'hypertension', 'asthma', 'COPD', 'heart disease'],
    fee: '$142.40',
  },
  {
    itemNumber: '723',
    description: 'Team Care Arrangement',
    category: 'chronic_disease',
    keywords: ['team care', 'multidisciplinary', 'allied health'],
    typicalConditions: ['complex chronic disease', 'multiple providers'],
    fee: '$118.45',
  },

  // Health Assessments
  {
    itemNumber: '701',
    description: 'Health assessment for patients 45-49 years',
    category: 'health_assessment',
    keywords: ['health check', 'assessment', 'preventive'],
    typicalConditions: ['general health check', 'preventive care'],
    fee: '$220.00',
  },
  {
    itemNumber: '703',
    description: 'Health assessment for patients 75+ years',
    category: 'health_assessment',
    keywords: ['elderly', 'senior', 'aged care', 'health check'],
    typicalConditions: ['elderly health assessment', 'aged care'],
    fee: '$220.00',
  },

  // Procedures
  {
    itemNumber: '11700',
    description: 'Electrocardiography (ECG)',
    category: 'procedure',
    keywords: ['ECG', 'EKG', 'heart test', 'cardiac'],
    typicalConditions: ['chest pain', 'heart palpitations', 'cardiac assessment'],
    fee: '$28.50',
  },
  {
    itemNumber: '11506',
    description: 'Spirometry',
    category: 'procedure',
    keywords: ['lung function', 'breathing test', 'respiratory'],
    typicalConditions: ['asthma', 'COPD', 'breathing difficulty'],
    fee: '$35.60',
  },
  {
    itemNumber: '30071',
    description: 'Wound management - simple',
    category: 'procedure',
    keywords: ['wound', 'dressing', 'bandage', 'laceration'],
    typicalConditions: ['wound care', 'laceration', 'injury'],
    fee: '$45.30',
  },

  // Mental Health
  {
    itemNumber: '2715',
    description: 'Mental Health Treatment Plan',
    category: 'mental_health',
    keywords: ['mental health', 'psychology', 'counseling', 'depression', 'anxiety'],
    typicalConditions: ['depression', 'anxiety', 'mental health condition'],
    fee: '$75.25',
  },
  {
    itemNumber: '2717',
    description: 'Mental Health Treatment Review',
    category: 'mental_health',
    keywords: ['mental health review', 'follow-up', 'psychology review'],
    typicalConditions: ['ongoing mental health care'],
    fee: '$75.25',
  },

  // After Hours
  {
    itemNumber: '5020',
    description: 'After hours attendance - unsociable hours',
    category: 'after_hours',
    keywords: ['after hours', 'evening', 'weekend', 'urgent'],
    typicalConditions: ['urgent care outside business hours'],
    fee: '$75.25',
  },
];

/**
 * Search MBS codes by query
 */
export function searchMBSCodes(query: string): MBSCode[] {
  const lowerQuery = query.toLowerCase();
  return mbsCodesDatabase.filter(
    (code) =>
      code.description.toLowerCase().includes(lowerQuery) ||
      code.keywords.some((keyword: string) => keyword.toLowerCase().includes(lowerQuery)) ||
      code.typicalConditions.some((condition: string) => condition.toLowerCase().includes(lowerQuery)) ||
      code.category.includes(lowerQuery)
  );
}

/**
 * Get MBS codes by category
 */
export function getCodesByCategory(category: MBSCode['category']): MBSCode[] {
  return mbsCodesDatabase.filter((code) => code.category === category);
}

/**
 * Format MBS codes for LLM context
 */
export function formatMBSCodesForPrompt(codes: MBSCode[]): string {
  return codes
    .map(
      (code) =>
        `Item ${code.itemNumber}: ${code.description} (${code.category}) - Fee: ${code.fee}\n  Keywords: ${code.keywords.join(', ')}\n  Typical for: ${code.typicalConditions.join(', ')}`
    )
    .join('\n\n');
}
