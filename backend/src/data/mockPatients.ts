import type { Patient } from '../types/patient.js';

/**
 * Mock Patient Data
 * Realistic patient records for training RAG system
 * In production, this would come from a database
 */
export const mockPatients: Patient[] = [
  {
    id: 'P001',
    firstName: 'John',
    lastName: 'Smith',
    dateOfBirth: '1958-03-15',
    age: 66,
    gender: 'male',
    phone: '+61 412 345 678',
    email: 'john.smith@email.com',
    address: '123 Main St, Sydney NSW 2000',
    mrn: 'MRN-001-2024',
    conditions: [
      {
        name: 'Type 2 Diabetes Mellitus',
        icd10Code: 'E11.9',
        diagnosedDate: '2020-05-10',
        status: 'chronic',
      },
      {
        name: 'Hypertension',
        icd10Code: 'I10',
        diagnosedDate: '2019-11-20',
        status: 'chronic',
      },
      {
        name: 'Hyperlipidemia',
        icd10Code: 'E78.5',
        diagnosedDate: '2021-02-14',
        status: 'active',
      },
    ],
    medications: [
      {
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        startDate: '2020-05-15',
        prescribingDoctor: 'Dr. Sarah Johnson',
      },
      {
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        startDate: '2019-11-25',
        prescribingDoctor: 'Dr. Sarah Johnson',
      },
      {
        name: 'Atorvastatin',
        dosage: '20mg',
        frequency: 'Once daily',
        startDate: '2021-02-20',
        prescribingDoctor: 'Dr. Sarah Johnson',
      },
    ],
    consultationNotes: [
      {
        id: 'CN001',
        date: '2024-01-15',
        doctor: 'Dr. Sarah Johnson',
        noteType: 'consultation',
        subjective:
          'Patient reports good glucose control. No episodes of hypoglycemia. Blood sugar readings averaging 6.5-7.2 mmol/L. No new symptoms.',
        objective:
          'BP: 128/82 mmHg. Weight: 85kg (stable). HbA1c: 6.8% (improved from 7.2%). Foot exam: No ulcers or infections. Retinal exam: No diabetic retinopathy.',
        assessment:
          'Type 2 Diabetes Mellitus - well controlled. Hypertension - controlled. Hyperlipidemia - controlled on statin therapy.',
        plan: 'Continue current medications. Recheck HbA1c in 3 months. Annual retinal screening scheduled. Patient education on diet and exercise reinforced.',
        fullText:
          'Consultation Date: 2024-01-15. Patient: John Smith (P001). Doctor: Dr. Sarah Johnson. Type 2 Diabetes Mellitus - well controlled with Metformin. Blood sugar readings averaging 6.5-7.2 mmol/L. HbA1c: 6.8% (improved). Hypertension controlled with Lisinopril. BP: 128/82 mmHg. Hyperlipidemia controlled with Atorvastatin. Continue current medications. Recheck HbA1c in 3 months.',
      },
      {
        id: 'CN002',
        date: '2024-02-20',
        doctor: 'Dr. Sarah Johnson',
        noteType: 'follow-up',
        subjective:
          'Patient reports increased fatigue over past 2 weeks. Blood sugar readings slightly elevated (7.5-8.2 mmol/L). No other concerns.',
        objective:
          'BP: 132/85 mmHg. Weight: 86kg (+1kg). HbA1c: 7.1% (slightly elevated). Physical exam unremarkable.',
        assessment:
          'Type 2 Diabetes Mellitus - suboptimal control. Possible need for medication adjustment.',
        plan: 'Increase Metformin to 1000mg twice daily. Recheck blood sugars in 2 weeks. Consider referral to diabetes educator if no improvement.',
        fullText:
          'Follow-up Date: 2024-02-20. Patient: John Smith (P001). Doctor: Dr. Sarah Johnson. Patient reports increased fatigue. Blood sugar readings elevated (7.5-8.2 mmol/L). HbA1c: 7.1% - suboptimal control. Increase Metformin dosage to 1000mg twice daily. Monitor blood sugars closely.',
      },
    ],
    lastVisitDate: '2024-02-20',
    nextAppointment: '2024-05-20',
    insuranceProvider: 'Medicare',
  },
  {
    id: 'P002',
    firstName: 'Mary',
    lastName: 'Williams',
    dateOfBirth: '1975-08-22',
    age: 48,
    gender: 'female',
    phone: '+61 423 456 789',
    email: 'mary.williams@email.com',
    address: '456 Oak Ave, Melbourne VIC 3000',
    mrn: 'MRN-002-2024',
    conditions: [
      {
        name: 'Asthma',
        icd10Code: 'J45.9',
        diagnosedDate: '2015-03-10',
        status: 'chronic',
      },
      {
        name: 'Seasonal Allergies',
        icd10Code: 'J30.9',
        diagnosedDate: '2016-09-05',
        status: 'active',
      },
    ],
    medications: [
      {
        name: 'Salbutamol Inhaler',
        dosage: '100mcg',
        frequency: 'As needed',
        startDate: '2015-03-15',
        prescribingDoctor: 'Dr. Michael Chen',
      },
      {
        name: 'Fluticasone/Salmeterol',
        dosage: '250/50mcg',
        frequency: 'Twice daily',
        startDate: '2018-06-10',
        prescribingDoctor: 'Dr. Michael Chen',
      },
      {
        name: 'Loratadine',
        dosage: '10mg',
        frequency: 'Once daily',
        startDate: '2016-09-10',
        prescribingDoctor: 'Dr. Michael Chen',
      },
    ],
    consultationNotes: [
      {
        id: 'CN003',
        date: '2024-01-10',
        doctor: 'Dr. Michael Chen',
        noteType: 'consultation',
        subjective:
          'Patient reports well-controlled asthma. Using rescue inhaler 1-2 times per week. No nighttime symptoms. Seasonal allergies manageable with antihistamine.',
        objective:
          'Lungs: Clear bilaterally. No wheezing. Peak flow: 450 L/min (baseline 420). Spirometry: FEV1 85% predicted (normal).',
        assessment:
          'Asthma - well controlled. Seasonal allergies - controlled with medication.',
        plan: 'Continue current medications. Annual spirometry completed - normal results. Review in 6 months or sooner if symptoms worsen.',
        fullText:
          'Consultation Date: 2024-01-10. Patient: Mary Williams (P002). Doctor: Dr. Michael Chen. Asthma well controlled. Using rescue inhaler 1-2 times per week. Peak flow: 450 L/min. Spirometry: FEV1 85% predicted - normal. Continue Salbutamol and Fluticasone/Salmeterol. Seasonal allergies controlled with Loratadine.',
      },
      {
        id: 'CN004',
        date: '2024-03-05',
        doctor: 'Dr. Michael Chen',
        noteType: 'emergency',
        subjective:
          'Patient presents with acute asthma exacerbation. Increased shortness of breath, wheezing, and chest tightness over past 4 hours. Used rescue inhaler 4 times with minimal relief.',
        objective:
          'Respiratory rate: 24/min. O2 sat: 94% on room air. Lungs: Bilateral wheezing, decreased air entry. Peak flow: 280 L/min (reduced from baseline).',
        assessment:
          'Acute asthma exacerbation - moderate severity. Requires immediate treatment.',
        plan: 'Nebulized Salbutamol 5mg x 2 doses. Oral Prednisolone 40mg daily for 5 days. Increase Fluticasone/Salmeterol frequency temporarily. Follow-up in 48 hours. Patient education on recognizing exacerbation signs.',
        fullText:
          'Emergency Visit Date: 2024-03-05. Patient: Mary Williams (P002). Doctor: Dr. Michael Chen. Acute asthma exacerbation. Increased shortness of breath and wheezing. Peak flow reduced to 280 L/min. Treated with nebulized Salbutamol and oral Prednisolone. Follow-up required in 48 hours.',
      },
    ],
    lastVisitDate: '2024-03-05',
    nextAppointment: '2024-07-10',
    insuranceProvider: 'Medicare',
  },
  {
    id: 'P003',
    firstName: 'David',
    lastName: 'Brown',
    dateOfBirth: '1982-11-30',
    age: 41,
    gender: 'male',
    phone: '+61 434 567 890',
    email: 'david.brown@email.com',
    address: '789 Pine Rd, Brisbane QLD 4000',
    mrn: 'MRN-003-2024',
    conditions: [
      {
        name: 'Migraine',
        icd10Code: 'G43.9',
        diagnosedDate: '2018-04-12',
        status: 'chronic',
      },
      {
        name: 'Anxiety Disorder',
        icd10Code: 'F41.9',
        diagnosedDate: '2020-08-20',
        status: 'active',
      },
    ],
    medications: [
      {
        name: 'Sumatriptan',
        dosage: '50mg',
        frequency: 'As needed for migraine',
        startDate: '2018-04-20',
        prescribingDoctor: 'Dr. Emily Davis',
      },
      {
        name: 'Propranolol',
        dosage: '40mg',
        frequency: 'Twice daily',
        startDate: '2019-01-15',
        prescribingDoctor: 'Dr. Emily Davis',
      },
      {
        name: 'Sertraline',
        dosage: '50mg',
        frequency: 'Once daily',
        startDate: '2020-09-01',
        prescribingDoctor: 'Dr. Emily Davis',
      },
    ],
    consultationNotes: [
      {
        id: 'CN005',
        date: '2024-02-12',
        doctor: 'Dr. Emily Davis',
        noteType: 'consultation',
        subjective:
          'Patient reports migraine frequency reduced from 4-5 per month to 1-2 per month since starting Propranolol. Anxiety symptoms well managed with Sertraline. No significant side effects.',
        objective:
          'BP: 118/75 mmHg. Heart rate: 68 bpm. Neurological exam: Normal. Mental status: Alert, appropriate mood.',
        assessment:
          'Migraine - improved with prophylactic therapy. Anxiety disorder - well controlled.',
        plan: 'Continue current medications. Consider increasing Propranolol if migraines persist. Review in 3 months.',
        fullText:
          'Consultation Date: 2024-02-12. Patient: David Brown (P003). Doctor: Dr. Emily Davis. Migraine frequency reduced to 1-2 per month with Propranolol prophylaxis. Anxiety well controlled with Sertraline. Continue current medications. Review in 3 months.',
      },
    ],
    lastVisitDate: '2024-02-12',
    nextAppointment: '2024-05-12',
    insuranceProvider: 'Medicare',
  },
  {
    id: 'P004',
    firstName: 'Sarah',
    lastName: 'Johnson',
    dateOfBirth: '1990-05-18',
    age: 34,
    gender: 'female',
    phone: '+61 445 678 901',
    email: 'sarah.johnson@email.com',
    address: '321 Elm St, Perth WA 6000',
    mrn: 'MRN-004-2024',
    conditions: [
      {
        name: 'Hypertension',
        icd10Code: 'I10',
        diagnosedDate: '2022-09-10',
        status: 'active',
      },
    ],
    medications: [
      {
        name: 'Amlodipine',
        dosage: '5mg',
        frequency: 'Once daily',
        startDate: '2022-09-15',
        prescribingDoctor: 'Dr. Robert Taylor',
      },
    ],
    consultationNotes: [
      {
        id: 'CN006',
        date: '2024-01-25',
        doctor: 'Dr. Robert Taylor',
        noteType: 'consultation',
        subjective:
          'Patient reports good blood pressure control. No side effects from medication. Regular exercise routine maintained.',
        objective:
          'BP: 122/78 mmHg (well controlled). Weight: 68kg. Physical exam: Normal.',
        assessment: 'Hypertension - well controlled on Amlodipine.',
        plan: 'Continue Amlodipine. Annual blood work scheduled. Review in 6 months.',
        fullText:
          'Consultation Date: 2024-01-25. Patient: Sarah Johnson (P004). Doctor: Dr. Robert Taylor. Hypertension well controlled. BP: 122/78 mmHg. Continue Amlodipine 5mg daily. Annual blood work scheduled.',
      },
    ],
    lastVisitDate: '2024-01-25',
    nextAppointment: '2024-07-25',
    insuranceProvider: 'Medicare',
  },
  {
    id: 'P005',
    firstName: 'James',
    lastName: 'Wilson',
    dateOfBirth: '1965-07-08',
    age: 58,
    gender: 'male',
    phone: '+61 456 789 012',
    email: 'james.wilson@email.com',
    address: '654 Maple Dr, Adelaide SA 5000',
    mrn: 'MRN-005-2024',
    conditions: [
      {
        name: 'Type 2 Diabetes Mellitus',
        icd10Code: 'E11.9',
        diagnosedDate: '2021-11-05',
        status: 'chronic',
      },
      {
        name: 'Osteoarthritis',
        icd10Code: 'M19.90',
        diagnosedDate: '2019-06-15',
        status: 'chronic',
      },
    ],
    medications: [
      {
        name: 'Metformin',
        dosage: '1000mg',
        frequency: 'Twice daily',
        startDate: '2021-11-10',
        prescribingDoctor: 'Dr. Sarah Johnson',
      },
      {
        name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'As needed for pain',
        startDate: '2019-06-20',
        prescribingDoctor: 'Dr. Sarah Johnson',
      },
      {
        name: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'As needed for joint pain',
        startDate: '2020-03-10',
        prescribingDoctor: 'Dr. Sarah Johnson',
      },
    ],
    consultationNotes: [
      {
        id: 'CN007',
        date: '2024-02-28',
        doctor: 'Dr. Sarah Johnson',
        noteType: 'consultation',
        subjective:
          'Patient reports stable diabetes control. Blood sugars averaging 7.0-7.5 mmol/L. Joint pain in knees manageable with occasional pain relief.',
        objective:
          'BP: 135/88 mmHg. Weight: 92kg. HbA1c: 7.2%. Joint exam: Mild crepitus in both knees, no effusion.',
        assessment:
          'Type 2 Diabetes Mellitus - acceptable control. Osteoarthritis - stable.',
        plan: 'Continue Metformin. Encourage weight loss for both diabetes and joint health. Consider physiotherapy referral for knee strengthening exercises.',
        fullText:
          'Consultation Date: 2024-02-28. Patient: James Wilson (P005). Doctor: Dr. Sarah Johnson. Type 2 Diabetes Mellitus - acceptable control. HbA1c: 7.2%. Blood sugars averaging 7.0-7.5 mmol/L. Osteoarthritis stable. Continue Metformin. Weight management discussed.',
      },
    ],
    lastVisitDate: '2024-02-28',
    nextAppointment: '2024-05-28',
    insuranceProvider: 'Medicare',
  },
];

/**
 * Get patient by ID
 */
export function getPatientById(patientId: string): Patient | undefined {
  return mockPatients.find((p) => p.id === patientId);
}

/**
 * Get patient by name (fuzzy search)
 */
export function getPatientByName(firstName: string, lastName?: string): Patient[] {
  const lowerFirstName = firstName.toLowerCase();
  const lowerLastName = lastName?.toLowerCase();
  
  return mockPatients.filter((p) => {
    const matchesFirst = p.firstName.toLowerCase().includes(lowerFirstName);
    if (lowerLastName) {
      return matchesFirst && p.lastName.toLowerCase().includes(lowerLastName);
    }
    return matchesFirst;
  });
}

/**
 * Get all patients
 */
export function getAllPatients(): Patient[] {
  return mockPatients;
}

