# VitaView AI Processing Pipeline

This directory contains VitaView's medical exam processing pipeline powered entirely by OpenAI.  
The same provider is responsible for extracting structured data from uploaded documents and for generating clinical insights.

## Architecture Overview

```
┌───────────┐    ┌──────────────────────────┐    ┌────────────┐
│ Raw Exam  │ -> │ OpenAI Vision Extraction │ -> │ Structured │
│ Document  │    │ (PDF/Image to JSON)      │    │    Data    │
└───────────┘    └──────────────────────────┘           │
                                                         ▼
                                                  ┌────────────┐
                                                  │ OpenAI     │
                                                  │ Insights   │
                                                  │ Generation │
                                                  └────────────┘
                                                         │
                                                         ▼
                                                  Final Analysis
```

1. The frontend uploads a PDF or image of the exam.
2. `openai.ts` sends the document to the OpenAI Responses API (GPT‑5 Vision) and receives structured metrics, metadata and summaries.
3. The structured data is persisted through `analyze-pipeline.ts` and associated with the current user/profile.
4. A secondary OpenAI call converts the structured metrics into contextual insights, diagnoses and recommendations.
5. Notifications are created and the UI presents both the raw extraction and the higher-level interpretation.

## Key Files

- `openai.ts` – wraps every interaction with the OpenAI API (extraction and insights).
- `analyze-pipeline.ts` – orchestrates the multi-step workflow (store exam, normalize metrics, trigger insights).
- `../routes.ts` – exposes HTTP endpoints for uploads, quick summaries and interpretations.

## Required Environment Variables

- `OPENAI_API_KEY` – OpenAI API authentication token used by all analysis steps.

## Error Handling

- If the OpenAI extraction call fails, the pipeline responds with a clear 503 message and no data is persisted.
- If the insights stage fails after extraction, the exam is stored with status `extraction_only` and the user is notified that only partial results are available.
- File uploads are deleted from OpenAI once the response is generated to avoid leaking temporary artifacts.

## Testing

- `../test-pipeline.ts` exercises the complete flow with a local file.
- `../test-ai.ts` and `../test-ai-pipeline.js` run integration tests against the OpenAI-only pipeline.
