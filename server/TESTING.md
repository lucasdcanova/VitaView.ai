# Testing the VitaView AI Pipeline

This guide explains how to test the dual AI pipeline that powers VitaView's exam analysis.

## Prerequisites

1. Make sure you have API keys for both services:
   - `GEMINI_API_KEY` - Google's Gemini API
   - `OPENAI_API_KEY` - OpenAI API (GPT-4o model)

2. These keys should already be set in your Replit environment.

## Testing Options

### 1. Database Schema Compatibility Test

This test verifies that the database can properly store all the data produced by the AI pipeline.

```bash
npx tsx server/test-db.ts
```

What this test checks:
- User access functions
- Exam creation and retrieval
- Exam result creation with complex JSON health metrics
- Preservation of health metrics structure in the database
- Exam status updates
- Individual health metrics storage

### 2. End-to-End AI Pipeline Test

This test verifies the complete integration between Gemini extraction and OpenAI analysis.

```bash
# First, place a medical exam file (PDF, JPEG, PNG) in the server/test-data directory
# Then run:
npx tsx server/test-ai.ts ./server/test-data/your-exam-file.pdf
```

What this test checks:
- File reading and processing
- Gemini extraction of health metrics
- Storage of extraction results
- OpenAI detailed analysis of the extracted data
- Exam status updates in the workflow
- Notification creation

### 3. Manual Testing via API Routes

You can also test the individual API endpoints:

```bash
# Test Gemini extraction endpoint
curl -X POST -H "Content-Type: multipart/form-data" \
  -F "file=@./server/test-data/your-exam-file.pdf" \
  -F "userId=1" \
  http://localhost:5000/api/exams/upload

# Test OpenAI analysis endpoint (replace EXAM_ID with actual ID)
curl -X POST -H "Content-Type: application/json" \
  -d '{"examId": EXAM_ID, "userId": 1}' \
  http://localhost:5000/api/exams/analyze
```

## Analyzing Test Results

The tests will output detailed information about each step in the process. Look for:

1. Success confirmations for each critical step
2. The amount and quality of health metrics extracted
3. The depth of the OpenAI analysis (number of diagnoses, recommendations, etc.)
4. Proper status updates in the database
5. Error handling and fallback behavior

If any test fails, the error message will provide details about what went wrong.

## Troubleshooting

Common issues:

1. **API Key Problems**: Make sure your API keys are set and valid.
   ```bash
   # Check if keys are set
   echo $GEMINI_API_KEY
   echo $OPENAI_API_KEY
   ```

2. **Database Issues**: Ensure the database is running and the schemas are up-to-date.
   ```bash
   # Push latest schema changes
   npm run db:push
   ```

3. **Network Problems**: Both APIs require internet access. Check your connection.

4. **Invalid Test Files**: For the AI pipeline test, make sure you're using a real medical exam file (PDF, JPEG, PNG).