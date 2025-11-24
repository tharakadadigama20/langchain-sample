import { z } from 'zod';

/**
 * Patient Data Types
 * Following medical data best practices with structured schemas
 */

export const PatientConditionSchema = z.object({
  name: z.string(),
  icd10Code: z.string().optional(),
  diagnosedDate: z.string().optional(),
  status: z.enum(['active', 'resolved', 'chronic']).default('active'),
});

export const MedicationSchema = z.object({
  name: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  prescribingDoctor: z.string().optional(),
});

export const ConsultationNoteSchema = z.object({
  id: z.string(),
  date: z.string(),
  doctor: z.string(),
  noteType: z.enum(['consultation', 'follow-up', 'emergency', 'procedure']),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  fullText: z.string(), // Full consultation text for embedding
});

export const PatientSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string(),
  age: z.number(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  conditions: z.array(PatientConditionSchema),
  medications: z.array(MedicationSchema),
  consultationNotes: z.array(ConsultationNoteSchema),
  lastVisitDate: z.string().optional(),
  nextAppointment: z.string().optional(),
  insuranceProvider: z.string().optional(),
  mrn: z.string().optional(), // Medical Record Number
});

export type Patient = z.infer<typeof PatientSchema>;
export type PatientCondition = z.infer<typeof PatientConditionSchema>;
export type Medication = z.infer<typeof MedicationSchema>;
export type ConsultationNote = z.infer<typeof ConsultationNoteSchema>;

/**
 * Patient Query Context
 * Used for RAG retrieval with metadata filtering
 */
export interface PatientQueryContext {
  patientId?: string;
  patientName?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  condition?: string;
  medication?: string;
  noteType?: ConsultationNote['noteType'];
}

