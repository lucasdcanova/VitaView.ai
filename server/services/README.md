# VitaView AI Processing Pipeline

This directory contains the implementation of VitaView's dual AI processing pipeline for medical exam analysis.

## Architecture Overview

The VitaView AI pipeline uses a two-stage approach to maximize accuracy and comprehensive analysis:

1. **Extraction Stage** (Gemini API)
   - Processes raw medical documents (PDFs, images)
   - Extracts structured data from unstructured content
   - Identifies health metrics, units, and basic parameters
   - Provides initial categorization and extraction

2. **Analysis Stage** (OpenAI API)
   - Receives structured data from the extraction stage
   - Performs deep medical analysis and interpretation
   - Generates clinical insights, recommendations, and potential diagnoses
   - Calculates health scores and identifies critical areas

```
┌───────────┐    ┌───────────┐    ┌────────────┐    ┌────────────┐
│ Raw Exam  │ -> │  Gemini   │ -> │ Structured │ -> │  OpenAI    │ -> Final Analysis
│ Document  │    │ Extraction│    │    Data    │    │  Analysis  │    & Insights
└───────────┘    └───────────┘    └────────────┘    └────────────┘
```

## Key Files

- `gemini.ts` - Handles the extraction phase using Google's Gemini API
- `openai.ts` - Handles the analysis phase using OpenAI's API
- `../routes.ts` - Contains the API endpoints that coordinate the pipeline flow

## Data Flow

1. User uploads an exam document via the frontend
2. The document is processed by Gemini for data extraction
3. Extracted data is stored in the database as an exam result
4. The exam status is updated to indicate extraction is complete
5. OpenAI is then used to analyze the extracted data
6. The analysis is stored in the database as another exam result
7. The user is notified when the complete analysis is ready
8. Frontend displays both extraction data and detailed analysis

## Required Environment Variables

Both APIs require authentication:

- `GEMINI_API_KEY` - For Google Gemini API access
- `OPENAI_API_KEY` - For OpenAI API access

## Error Handling

Both services include fallback mechanisms:
- If Gemini fails, OpenAI can be used directly for document analysis
- If OpenAI fails, a simplified analysis is provided
- All errors are logged and reported to the client with appropriate status codes

## Testing

See `../test-ai-pipeline.js` for an end-to-end test of the entire pipeline.