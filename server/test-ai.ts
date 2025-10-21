/**
 * Test script for verifying the OpenAI-only pipeline integration
 * 
 * This script tests the complete flow from document extraction to detailed analysis:
 * 1. Simulates uploading a medical exam document
 * 2. Processes it through the OpenAI API for data extraction
 * 3. Takes the extracted data and sends it again to OpenAI for detailed analysis
 * 4. Displays the complete result
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeDocumentWithOpenAI, analyzeExtractedExam } from './services/openai';
import { storage } from './storage';

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure test constants
const TEST_USER_ID = 1; // Make sure this user exists in your database
const TEST_FILE_PATH = process.argv[2] || path.join(__dirname, 'test-data', 'sample-exam.pdf'); // Path to test exam file
const TEST_FILE_TYPE = path.extname(TEST_FILE_PATH).substring(1); // Get file extension

// Check if sample file exists
if (!fs.existsSync(TEST_FILE_PATH)) {
  console.error(`Test file not found: ${TEST_FILE_PATH}`);
  // console.log(`Usage: npx tsx ${path.relative(process.cwd(), __filename)} [path-to-test-file]`);
  process.exit(1);
}

async function runPipelineTest() {
  // console.log('======= AI PIPELINE INTEGRATION TEST =======');
  // console.log(`Testing with file: ${TEST_FILE_PATH} (${TEST_FILE_TYPE})`);
  
  try {
    // Step 1: Read file content
    // console.log('\n1. Reading test file content...');
    const fileContent = fs.readFileSync(TEST_FILE_PATH).toString('base64');
    // console.log(`File loaded: ${(fileContent.length / 1024).toFixed(2)} KB`);
    
    // Step 2: Process with OpenAI API (extraction phase)
    // console.log('\n2. Running extraction with OpenAI API...');
    const extractionData = await analyzeDocumentWithOpenAI(fileContent, TEST_FILE_TYPE);
    
    if (!extractionData || 'error' in extractionData) {
      throw new Error(`OpenAI extraction failed: ${(extractionData as any)?.error || 'Unknown error'}`);
    }
    
    // console.log('OpenAI extraction successful!');
    // console.log(`- Summary: ${extractionData.summary || 'Not available'}`);
    // console.log(`- Health metrics extracted: ${extractionData.healthMetrics?.length || 0}`);
    
    // Step 3: Create a test exam record in the database
    // console.log('\n3. Creating test exam record in database...');
    const exam = await storage.createExam({
      userId: TEST_USER_ID,
      name: `Test Exam (${new Date().toISOString()})`,
      fileType: TEST_FILE_TYPE,
      status: 'extracted',
      laboratoryName: extractionData.laboratoryName || 'Test Laboratory',
      examDate: extractionData.examDate || new Date().toISOString().split('T')[0],
      requestingPhysician: extractionData.requestingPhysician || 'Dr. Test',
      originalContent: fileContent.substring(0, 1000) + '...' // Store only first 1000 chars
    });
    
    // console.log(`Exam created with ID: ${exam.id}`);
    
    // Step 4: Store the extraction result
    // console.log('\n4. Storing OpenAI extraction result...');
    const extractionRecord = await storage.createExamResult({
      examId: exam.id,
      summary: extractionData.summary || 'No summary available',
      detailedAnalysis: JSON.stringify(extractionData),
      recommendations: extractionData.recommendations?.join('\n') || 'No recommendations available',
      healthMetrics: extractionData.healthMetrics || [],
      aiProvider: extractionData.aiProvider || 'openai:extraction'
    });
    
    // console.log(`Extraction result stored with ID: ${extractionRecord.id}`);
    
    // Step 5: Process with OpenAI for detailed analysis
    // console.log('\n5. Running analysis with OpenAI API...');
    const patientData = {
      gender: 'masculino',
      age: 45,
      diseases: ['hipertensão'],
      surgeries: [],
      allergies: ['penicilina'],
      familyHistory: 'Pai com diabetes tipo 2'
    };
    
    const openaiResult = await analyzeExtractedExam(exam.id, TEST_USER_ID, storage, patientData);
    
    if (!openaiResult || 'error' in openaiResult) {
      throw new Error(`OpenAI analysis failed: ${(openaiResult as any)?.message || 'Unknown error'}`);
    }
    
    // console.log('OpenAI analysis successful!');
    // console.log(`- Analysis depth: ${Object.keys(openaiResult.insights || {}).length} key areas`);
    // console.log(`- Diagnoses identified: ${openaiResult.insights?.possibleDiagnoses?.length || 0}`);
    // console.log(`- Recommendations: ${openaiResult.insights?.recommendations?.length || 0}`);
    
    // Step 6: Verify the complete pipeline integration
    // console.log('\n6. Verifying complete pipeline integration...');
    
    // Retrieve exam with updated status
    const updatedExam = await storage.getExam(exam.id);
    if (!updatedExam) {
      throw new Error(`Failed to retrieve exam with ID ${exam.id}`);
    }
    
    if (updatedExam.status !== 'analyzed') {
      console.warn(`Warning: Expected exam status to be 'analyzed', got '${updatedExam.status}'`);
    } else {
      // console.log('Exam status successfully updated to "analyzed"');
    }
    
    // Check if analysis result exists
    const analysisResults = await storage.getExamResultByExamId(exam.id);
    // console.log(`Found ${analysisResults ? '1' : '0'} analysis results for exam`);
    
    // Check if notification was created
    const notifications = await storage.getNotificationsByUserId(TEST_USER_ID);
    const examNotification = notifications.find(n => 
      n.message.includes(exam.name) && n.title.includes('Análise completa')
    );
    
    if (examNotification) {
      // console.log('Notification successfully created for the analyzed exam');
    } else {
      console.warn('Warning: No notification found for the analyzed exam');
    }
    
    // console.log('\n======= TEST SUMMARY =======');
    // console.log('✓ OpenAI extraction completed successfully');
    // console.log('✓ OpenAI analysis completed successfully');
    // console.log('✓ Complete pipeline integration verified');
    // console.log('\nTest result: SUCCESS');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run the test
runPipelineTest()
  .then(() => {
    // console.log('\nTest completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unhandled error in test execution:', err);
    process.exit(1);
  });
