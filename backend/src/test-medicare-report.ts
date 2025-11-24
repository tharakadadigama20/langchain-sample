import { medicareReportTool } from './tools/medicareReportTool.js';

/**
 * Test script for Medicare Report Generator Tool (Simplified Version)
 * 
 * This demonstrates the simplified Medicare report generation with minimal input
 */

async function testMedicareReportGeneration() {
  console.log('🧪 Testing Medicare Report Generator Tool (Simplified)\n');
  console.log('='.repeat(60));

  // Test 1: Minimal input (most common use case)
  const minimalTest = {
    patientName: 'John Smith',
    mbsItemNumber: '23',
    consultationNotes: 'Patient presented with cough and fever for 3 days',
  };

  console.log('\n📋 Test 1: Minimal Input');
  console.log('- Patient:', minimalTest.patientName);
  console.log('- MBS Code:', minimalTest.mbsItemNumber);
  console.log('- Notes:', minimalTest.consultationNotes);
  console.log('\n🔄 Generating Medicare report...\n');

  try {
    const result = await medicareReportTool.invoke(minimalTest);
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULT:\n');
    console.log(result);
    console.log('\n' + '='.repeat(60));
  } catch (error) {
    console.error('\n❌ Test 1 failed:', error);
  }

  // Test 2: With optional fields
  console.log('\n\n📋 Test 2: With Optional Fields');
  const detailedTest = {
    patientName: 'Jane Doe',
    mbsItemNumber: '36',
    consultationNotes: 'Patient with chronic back pain. Discussed management options including physiotherapy and pain management.',
    consultationDate: '2024-11-24',
    patientDOB: '1985-06-20',
    providerName: 'Dr. Michael Chen',
    providerNumber: '234567CD',
  };

  console.log('- Patient:', detailedTest.patientName);
  console.log('- MBS Code:', detailedTest.mbsItemNumber);
  console.log('- Provider:', detailedTest.providerName);
  console.log('\n🔄 Generating Medicare report...\n');

  try {
    const result = await medicareReportTool.invoke(detailedTest);
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULT:\n');
    console.log(result);
    console.log('\n' + '='.repeat(60));
  } catch (error) {
    console.error('\n❌ Test 2 failed:', error);
  }
}

// Run the test
console.log('\n🚀 Starting Medicare Report Generator Test...\n');
testMedicareReportGeneration()
  .then(() => {
    console.log('\n✅ All tests completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  });
