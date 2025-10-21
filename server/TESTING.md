# Testing the VitaView AI Pipeline

This guide explains how to test the OpenAI-powered pipeline that drives VitaView's exam analysis.

## Prerequisites

1. Make sure you have a valid OpenAI API key configured:
   - `OPENAI_API_KEY` - OpenAI API (GPT-4o / GPT-5 Vision)

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

This test verifies the complete OpenAI pipeline (extraction + analysis).

```bash
# First, place a medical exam file (PDF, JPEG, PNG) in the server/test-data directory
# Then run:
npx tsx server/test-ai.ts ./server/test-data/your-exam-file.pdf
```

What this test checks:
- File reading and processing
- OpenAI extraction of health metrics
- Storage of extraction results
- OpenAI detailed analysis of the extracted data
- Exam status updates in the workflow
- Notification creation

### 3. Manual Testing via API Routes

You can also test the individual API endpoints:

```bash
# Test OpenAI extraction endpoint
curl -X POST -H "Content-Type: multipart/form-data" \
  -F "file=@./server/test-data/your-exam-file.pdf" \
  -F "fileType=pdf" \
  http://localhost:5000/api/analyze/openai

# Test OpenAI interpretation endpoint (replace EXAM_ID with actual ID)
curl -X POST -H "Content-Type: application/json" \
  -d '{"analysisResult": {"summary": "Exemplo"}, "patientData": {}}' \
  http://localhost:5000/api/analyze/interpretation
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
   echo $OPENAI_API_KEY
   ```

2. **Database Issues**: Ensure the database is running and the schemas are up-to-date.
   ```bash
   # Push latest schema changes
   npm run db:push
   ```

3. **Network Problems**: Both APIs require internet access. Check your connection.

4. **Invalid Test Files**: For the AI pipeline test, make sure you're using a real medical exam file (PDF, JPEG, PNG).
