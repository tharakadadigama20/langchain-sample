import type { MedicalTerm } from '../types/transcription.js';

/**
 * Medical Terminology Knowledge Base
 * 
 * Comprehensive database of medical terms with common misspellings,
 * abbreviations, and corrections for use in transcription correction.
 * 
 * This will be used with RAG to provide context-aware corrections.
 */

export const medicalTermsDatabase: MedicalTerm[] = [
  // Common Conditions
  {
    incorrect: ['hyper tension', 'hypertention', 'high blood pressure disorder'],
    correct: 'hypertension',
    category: 'condition',
    explanation: 'High blood pressure',
  },
  {
    incorrect: ['diabeetus', 'diabetis', 'diabetus', 'sugar disease'],
    correct: 'diabetes',
    category: 'condition',
    explanation: 'Metabolic disorder affecting blood sugar',
  },
  {
    incorrect: ['astma', 'asma', 'breathing problem'],
    correct: 'asthma',
    category: 'condition',
    explanation: 'Respiratory condition causing breathing difficulties',
  },
  {
    incorrect: ['migrane', 'migrain', 'severe headache'],
    correct: 'migraine',
    category: 'condition',
    explanation: 'Severe recurring headache',
  },
  {
    incorrect: ['arthuritis', 'arthiritis', 'joint pain disease'],
    correct: 'arthritis',
    category: 'condition',
    explanation: 'Joint inflammation',
  },
  {
    incorrect: ['osteo arthritis', 'osteoarthuritis'],
    correct: 'osteoarthritis',
    category: 'condition',
    explanation: 'Degenerative joint disease',
  },
  {
    incorrect: ['anxeity', 'anxity', 'anxiety disorder'],
    correct: 'anxiety',
    category: 'condition',
    explanation: 'Mental health condition',
  },
  {
    incorrect: ['depresion', 'deppression'],
    correct: 'depression',
    category: 'condition',
    explanation: 'Mental health condition affecting mood',
  },
  {
    incorrect: ['pneumonia', 'numonia', 'lung infection'],
    correct: 'pneumonia',
    category: 'condition',
    explanation: 'Lung infection',
  },
  {
    incorrect: ['bronchitus', 'bronkitis'],
    correct: 'bronchitis',
    category: 'condition',
    explanation: 'Inflammation of bronchial tubes',
  },

  // Medications
  {
    incorrect: ['metaformin', 'metformin'],
    correct: 'Metformin',
    category: 'medication',
    explanation: 'Diabetes medication',
  },
  {
    incorrect: ['lipator', 'lipiter', 'lipitor'],
    correct: 'Lipitor',
    category: 'medication',
    explanation: 'Cholesterol medication (atorvastatin)',
  },
  {
    incorrect: ['amoxicilin', 'amoxicillin', 'amoxycillin'],
    correct: 'Amoxicillin',
    category: 'medication',
    explanation: 'Antibiotic',
  },
  {
    incorrect: ['ibuprofen', 'ibuprofin'],
    correct: 'Ibuprofen',
    category: 'medication',
    explanation: 'Pain reliever and anti-inflammatory',
  },
  {
    incorrect: ['paracetamol', 'paracetomol'],
    correct: 'Paracetamol',
    category: 'medication',
    explanation: 'Pain reliever and fever reducer',
  },
  {
    incorrect: ['asprin', 'aspirin'],
    correct: 'Aspirin',
    category: 'medication',
    explanation: 'Pain reliever and blood thinner',
  },
  {
    incorrect: ['omeprazol', 'omeprazole'],
    correct: 'Omeprazole',
    category: 'medication',
    explanation: 'Proton pump inhibitor for acid reflux',
  },
  {
    incorrect: ['losartan', 'losarten'],
    correct: 'Losartan',
    category: 'medication',
    explanation: 'Blood pressure medication',
  },
  {
    incorrect: ['amlodipine', 'amlodapine'],
    correct: 'Amlodipine',
    category: 'medication',
    explanation: 'Calcium channel blocker for blood pressure',
  },
  {
    incorrect: ['levothyroxine', 'levothyroxin'],
    correct: 'Levothyroxine',
    category: 'medication',
    explanation: 'Thyroid hormone replacement',
  },

  // Medical Procedures
  {
    incorrect: ['ecg', 'ekg', 'electro cardiogram'],
    correct: 'electrocardiogram',
    category: 'procedure',
    explanation: 'Heart electrical activity test',
  },
  {
    incorrect: ['mri', 'magnetic resonance'],
    correct: 'MRI (Magnetic Resonance Imaging)',
    category: 'procedure',
    explanation: 'Imaging scan',
  },
  {
    incorrect: ['ct scan', 'cat scan'],
    correct: 'CT scan (Computed Tomography)',
    category: 'procedure',
    explanation: 'X-ray imaging',
  },
  {
    incorrect: ['ultra sound', 'ultrasound scan'],
    correct: 'ultrasound',
    category: 'procedure',
    explanation: 'Sound wave imaging',
  },
  {
    incorrect: ['blood test', 'blood work'],
    correct: 'blood test',
    category: 'procedure',
    explanation: 'Laboratory blood analysis',
  },
  {
    incorrect: ['xray', 'x ray'],
    correct: 'X-ray',
    category: 'procedure',
    explanation: 'Radiographic imaging',
  },

  // Anatomy
  {
    incorrect: ['stomache', 'stomack'],
    correct: 'stomach',
    category: 'anatomy',
    explanation: 'Digestive organ',
  },
  {
    incorrect: ['kidny', 'kidney'],
    correct: 'kidney',
    category: 'anatomy',
    explanation: 'Organ that filters blood',
  },
  {
    incorrect: ['lever', 'livr'],
    correct: 'liver',
    category: 'anatomy',
    explanation: 'Organ that processes nutrients',
  },
  {
    incorrect: ['hart', 'heart'],
    correct: 'heart',
    category: 'anatomy',
    explanation: 'Organ that pumps blood',
  },
  {
    incorrect: ['lungs', 'lung'],
    correct: 'lungs',
    category: 'anatomy',
    explanation: 'Respiratory organs',
  },

  // Common Abbreviations
  {
    incorrect: ['b p', 'blood pressure'],
    correct: 'BP (Blood Pressure)',
    category: 'abbreviation',
    explanation: 'Blood pressure measurement',
  },
  {
    incorrect: ['h r', 'heart rate'],
    correct: 'HR (Heart Rate)',
    category: 'abbreviation',
    explanation: 'Heart beats per minute',
  },
  {
    incorrect: ['temp', 'temperature'],
    correct: 'temperature',
    category: 'abbreviation',
    explanation: 'Body temperature',
  },
  {
    incorrect: ['resp rate', 'respiratory rate'],
    correct: 'respiratory rate',
    category: 'abbreviation',
    explanation: 'Breaths per minute',
  },
  {
    incorrect: ['o2 sat', 'oxygen saturation'],
    correct: 'O2 saturation',
    category: 'abbreviation',
    explanation: 'Oxygen level in blood',
  },

  // Symptoms
  {
    incorrect: ['nausia', 'nausea'],
    correct: 'nausea',
    category: 'symptom',
    explanation: 'Feeling of sickness',
  },
  {
    incorrect: ['dizzyness', 'dizziness'],
    correct: 'dizziness',
    category: 'symptom',
    explanation: 'Feeling of spinning or lightheadedness',
  },
  {
    incorrect: ['fatigue', 'fatige'],
    correct: 'fatigue',
    category: 'symptom',
    explanation: 'Extreme tiredness',
  },
  {
    incorrect: ['coff', 'coughing'],
    correct: 'cough',
    category: 'symptom',
    explanation: 'Forceful expulsion of air from lungs',
  },
  {
    incorrect: ['fever', 'high temperature'],
    correct: 'fever',
    category: 'symptom',
    explanation: 'Elevated body temperature',
  },
  {
    incorrect: ['shortness of breath', 'sob', 'breathing difficulty'],
    correct: 'dyspnea',
    category: 'symptom',
    explanation: 'Difficulty breathing',
  },
  {
    incorrect: ['chest pain', 'chest discomfort'],
    correct: 'chest pain',
    category: 'symptom',
    explanation: 'Pain in chest area',
  },
  {
    incorrect: ['abdominal pain', 'stomach pain', 'belly pain'],
    correct: 'abdominal pain',
    category: 'symptom',
    explanation: 'Pain in abdomen',
  },
];

/**
 * Helper function to search medical terms
 */
export function searchMedicalTerms(query: string): MedicalTerm[] {
  const lowerQuery = query.toLowerCase();
  return medicalTermsDatabase.filter(
    (term) =>
      term.correct.toLowerCase().includes(lowerQuery) ||
      term.incorrect.some((inc) => inc.toLowerCase().includes(lowerQuery)) ||
      term.category.includes(lowerQuery)
  );
}

/**
 * Helper function to find correction for a term
 */
export function findCorrection(term: string): MedicalTerm | null {
  const lowerTerm = term.toLowerCase().trim();
  return (
    medicalTermsDatabase.find((medTerm) =>
      medTerm.incorrect.some((inc) => inc.toLowerCase() === lowerTerm)
    ) || null
  );
}

/**
 * Get all terms by category
 */
export function getTermsByCategory(category: MedicalTerm['category']): MedicalTerm[] {
  return medicalTermsDatabase.filter((term) => term.category === category);
}

/**
 * Format medical terms for LLM context
 */
export function formatMedicalTermsForPrompt(limit: number = 50): string {
  const terms = medicalTermsDatabase.slice(0, limit);
  return terms
    .map(
      (term) =>
        `- ${term.incorrect.join(', ')} → ${term.correct} (${term.category})`
    )
    .join('\n');
}
