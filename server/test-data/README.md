# Test Data Directory

This directory should contain test medical exam files (PDF, JPEG, PNG) for testing the AI pipeline.

## How to Use

1. Place real medical exam files in this directory
2. Run the test script: `NODE_ENV=development node server/test-ai-pipeline.js ./server/test-data/your-file.pdf`

**Important**: Do not commit real medical exams or personal health information to this directory.
This is only for local testing purposes.

## Recommended File Types

- PDF exams (`*.pdf`)
- Blood test scans (`*.jpg`, `*.jpeg`, `*.png`)
- Other medical reports in image format

## Example Test Command

```bash
# Test with a specific file
NODE_ENV=development node server/test-ai-pipeline.js ./server/test-data/sample-exam.pdf

# The script will automatically detect the file type based on extension
```