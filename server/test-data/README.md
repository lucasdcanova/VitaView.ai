# Test Data Directory

This directory is intended for storing medical exam files used in testing the AI pipeline.

## Adding Test Files

To test the full AI pipeline, place any of the following file types in this directory:

- **PDF files** - Blood test reports, lab results, etc.
- **JPEG/JPG images** - Scanned lab reports
- **PNG images** - Screenshots of medical results

## Running Tests With Your Files

After placing a test file (e.g., `my-bloodwork.pdf`) in this directory, you can run:

```bash
NODE_ENV=development node server/test-ai-pipeline.js ./server/test-data/my-bloodwork.pdf
```

## Privacy Notice

⚠️ **IMPORTANT**: Never commit real medical exam files to this repository. 
If you're using real exam data, make sure to add this directory to `.gitignore`.