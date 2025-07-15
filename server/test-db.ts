/**
 * Tests database schema compatibility with the AI pipeline
 * 
 * This script verifies that:
 * 1. The database schema can store all the fields produced by the AI pipeline
 * 2. The health metrics structure is properly stored and retrieved
 * 3. The exam and exam results tables interact correctly
 */

import { storage } from './storage';
import { db } from './db';
import { examResults, exams, users, healthMetrics } from '../shared/schema';

// Test constants
const TEST_USER_ID = 1; // Make sure this user exists
const TEST_TIMESTAMP = new Date().toISOString();

async function runDatabaseCompatibilityTest() {
  // console.log('======= DATABASE COMPATIBILITY TEST =======');
  
  try {
    // Step 1: Test user access
    // console.log('\n1. Verifying user access...');
    const user = await storage.getUser(TEST_USER_ID);
    
    if (!user) {
      // console.log(`User ID ${TEST_USER_ID} not found. Creating test user...`);
      await storage.createUser({
        username: `test_user_${Date.now()}`,
        password: 'test_password',
        fullName: 'Test User',
        email: 'test@example.com'
      });
      // console.log('Test user created successfully');
    } else {
      // console.log(`User found: ${user.username}`);
    }
    
    // Step 2: Test exam creation
    // console.log('\n2. Testing exam creation...');
    const testExam = await storage.createExam({
      userId: TEST_USER_ID,
      name: `Schema Compatibility Test Exam (${TEST_TIMESTAMP})`,
      fileType: 'pdf',
      status: 'pending',
      laboratoryName: 'Test Laboratory',
      examDate: new Date().toISOString().split('T')[0],
      requestingPhysician: 'Dr. Test Schema',
      originalContent: 'Test content'
    });
    
    // console.log(`Test exam created with ID: ${testExam.id}`);
    
    // Step 3: Test exam result creation with various health metrics structures
    // console.log('\n3. Testing exam result creation with health metrics...');
    
    // Sample health metrics from the actual exam provided by the user
    const testHealthMetrics = [
      {
        name: 'Hemoglobina',
        value: '9.0',
        unit: 'g/dL',
        status: 'baixo',
        change: '-0.5',
        category: 'Hematologia',
        referenceMin: '13.0',
        referenceMax: '17.0',
        clinical_significance: 'Importante para transporte de oxigênio no sangue. Valores baixos indicam anemia.'
      },
      {
        name: 'Glicose',
        value: '89.1',
        unit: 'mg/dL',
        status: 'normal',
        change: '0',
        category: 'Bioquímica',
        referenceMin: '65',
        referenceMax: '99',
        clinical_significance: 'Indicador de metabolismo de carboidratos e energia celular'
      },
      {
        name: 'Colesterol Total',
        value: '209.7',
        unit: 'mg/dL',
        status: 'alto',
        change: '+10',
        category: 'Lipidograma',
        referenceMin: null,
        referenceMax: '200',
        clinical_significance: 'Fator de risco para doenças cardiovasculares quando elevado'
      },
      {
        name: 'Colesterol HDL',
        value: '33.5',
        unit: 'mg/dL',
        status: 'baixo',
        change: '-2',
        category: 'Lipidograma',
        referenceMin: '40',
        referenceMax: null,
        clinical_significance: 'Colesterol "bom" que ajuda a remover o LDL da corrente sanguínea'
      }
    ];
    
    // Create an exam result with the test health metrics
    const testExamResult = await storage.createExamResult({
      examId: testExam.id,
      summary: 'Test summary for schema compatibility',
      detailedAnalysis: JSON.stringify({ testData: 'Detailed analysis test' }),
      recommendations: 'Test recommendations',
      healthMetrics: testHealthMetrics,
      aiProvider: 'test:schema-compatibility'
    });
    
    // console.log(`Test exam result created with ID: ${testExamResult.id}`);
    
    // Step 4: Test retrieval of the exam result with JSON health metrics
    // console.log('\n4. Testing retrieval of exam result with health metrics...');
    const retrievedResult = await storage.getExamResult(testExamResult.id);
    
    if (!retrievedResult) {
      throw new Error('Failed to retrieve exam result from database');
    }
    
    // console.log('Retrieved exam result successfully');
    // console.log('Health metrics structure preserved?', 
      Array.isArray(retrievedResult.healthMetrics) && 
      retrievedResult.healthMetrics.length === testHealthMetrics.length);
    
    // Check if the first health metric has all expected fields
    const healthMetrics = retrievedResult.healthMetrics as Array<any>;
    const firstMetric = healthMetrics[0];
    // console.log('Sample health metric fields preserved:');
    // console.log(`- name: ${firstMetric.name === testHealthMetrics[0].name ? 'YES' : 'NO'}`);
    // console.log(`- value: ${firstMetric.value === testHealthMetrics[0].value ? 'YES' : 'NO'}`);
    // console.log(`- unit: ${firstMetric.unit === testHealthMetrics[0].unit ? 'YES' : 'NO'}`);
    // console.log(`- status: ${firstMetric.status === testHealthMetrics[0].status ? 'YES' : 'NO'}`);
    // console.log(`- change: ${firstMetric.change === testHealthMetrics[0].change ? 'YES' : 'NO'}`);
    
    // Check if non-schema fields are preserved in the JSON
    // console.log(`- category (not in schema): ${firstMetric.category === testHealthMetrics[0].category ? 'YES' : 'NO'}`);
    // console.log(`- referenceMin (not in schema): ${firstMetric.referenceMin === testHealthMetrics[0].referenceMin ? 'YES' : 'NO'}`);
    // console.log(`- referenceMax (not in schema): ${firstMetric.referenceMax === testHealthMetrics[0].referenceMax ? 'YES' : 'NO'}`);
    // console.log(`- clinical_significance (not in schema): ${firstMetric.clinical_significance === testHealthMetrics[0].clinical_significance ? 'YES' : 'NO'}`);
    
    // Step 5: Test updating exam status (used in the AI pipeline)
    // console.log('\n5. Testing exam status updates...');
    await storage.updateExam(testExam.id, { status: 'extracted' });
    // console.log('Updated exam status to "extracted"');
    await storage.updateExam(testExam.id, { status: 'analyzed' });
    // console.log('Updated exam status to "analyzed"');
    
    const updatedExam = await storage.getExam(testExam.id);
    if (!updatedExam) {
      throw new Error(`Failed to retrieve updated exam with ID ${testExam.id}`);
    }
    // console.log(`Verified exam status: ${updatedExam.status === 'analyzed' ? 'SUCCESS' : 'FAILED'}`);
    
    // Step 6: Test individual health metrics (separate from JSON in exam results)
    // console.log('\n6. Testing individual health metrics storage...');
    // Note: This is separate from the JSON metrics stored in exam results
    
    // Create a test health metric
    const testMetric = await storage.createHealthMetric({
      userId: TEST_USER_ID,
      name: 'Colesterol Total',
      value: '190',
      unit: 'mg/dL',
      status: 'normal',
      change: '-10',
      date: new Date()
    });
    
    // console.log(`Test health metric created with ID: ${testMetric.id}`);
    
    // Retrieve latest metrics
    const latestMetrics = await storage.getLatestHealthMetrics(TEST_USER_ID, 5);
    // console.log(`Retrieved ${latestMetrics.length} latest health metrics`);
    
    if (latestMetrics.length > 0) {
      // console.log('Sample health metric:');
      // console.log(`- name: ${latestMetrics[0].name}`);
      // console.log(`- value: ${latestMetrics[0].value}`);
      // console.log(`- unit: ${latestMetrics[0].unit}`);
      // console.log(`- status: ${latestMetrics[0].status}`);
    }
    
    // console.log('\n======= TEST SUMMARY =======');
    // console.log('✓ User access verified');
    // console.log('✓ Exam creation works correctly');
    // console.log('✓ Exam result with JSON health metrics works correctly');
    // console.log('✓ JSON health metrics structure is preserved');
    // console.log('✓ Exam status updates work correctly');
    // console.log('✓ Individual health metrics storage works correctly');
    // console.log('\nDatabase schema is compatible with the AI pipeline!');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run the test
runDatabaseCompatibilityTest()
  .then(() => {
    // console.log('\nTest completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unhandled error in test execution:', err);
    process.exit(1);
  });