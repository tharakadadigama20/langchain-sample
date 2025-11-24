import { billingOpportunityTool } from './tools/billingOpportunityTool.js';

/**
 * Test script for billing opportunity tool
 * Run with: npx tsx src/test-billing-opportunity.ts
 */

async function testBillingOpportunityTool() {
  console.log('🧪 Testing Billing Opportunity Tool\n');
  console.log('='.repeat(80));
  
  // Test Case 1: Chronic Disease Management
  console.log('\n📋 Test Case 1: Chronic Disease Management Opportunity\n');
  const test1 = await billingOpportunityTool.invoke({
    consultationNotes: `Patient is a 65-year-old with diabetes and hypertension. We discussed his blood sugar levels which have been elevated. Also reviewed his blood pressure medications and made some adjustments. Patient will continue monitoring at home. Follow-up in 3 months for ongoing management.`,
    consultationDuration: '25 minutes',
    patientAge: 65,
  });
  console.log(test1);
  console.log('\n' + '='.repeat(80));

  // Test Case 2: Procedure Detection
  console.log('\n📋 Test Case 2: Procedure Detection (ECG)\n');
  const test2 = await billingOpportunityTool.invoke({
    consultationNotes: `Patient presented with chest pain. Took a detailed history. Performed a heart rhythm check which showed normal sinus rhythm. Reassured patient and advised to return if symptoms worsen.`,
    consultationDuration: '20 minutes',
  });
  console.log(test2);
  console.log('\n' + '='.repeat(80));

  // Test Case 3: Health Assessment (Age-Based)
  console.log('\n📋 Test Case 3: Health Assessment for Elderly Patient\n');
  const test3 = await billingOpportunityTool.invoke({
    consultationNotes: `Routine check-up for Mrs. Johnson. Reviewed her medications - she's on 5 different medications. Discussed her mobility and fall risk. She's doing well overall.`,
    consultationDuration: '25 minutes',
    patientAge: 78,
  });
  console.log(test3);
  console.log('\n' + '='.repeat(80));

  // Test Case 4: Mental Health Opportunity
  console.log('\n📋 Test Case 4: Mental Health Treatment Opportunity\n');
  const test4 = await billingOpportunityTool.invoke({
    consultationNotes: `Patient came in feeling very stressed and anxious about work. Has been having trouble sleeping and feeling down for the past few weeks. We discussed coping strategies and I recommended some lifestyle changes. Will monitor closely.`,
    consultationDuration: '30 minutes',
  });
  console.log(test4);
  console.log('\n' + '='.repeat(80));

  // Test Case 5: With Already Suggested Codes (should avoid duplicates)
  console.log('\n📋 Test Case 5: Avoiding Duplicate Suggestions\n');
  const test5 = await billingOpportunityTool.invoke({
    consultationNotes: `Patient with diabetes and hypertension. Reviewed medications and created a comprehensive care plan. 30-minute consultation.`,
    suggestedCodes: ['36', '721'], // Already suggested Level B consultation and GP Management Plan
    consultationDuration: '30 minutes',
  });
  console.log(test5);
  console.log('\n' + '='.repeat(80));

  console.log('\n✅ All tests completed!\n');
}

// Run tests
testBillingOpportunityTool().catch(console.error);
