# Grievance Redressal System - LangSmith Integration

This document describes the integration of LangSmith for monitoring and visualizing LLM operations in the Grievance Redressal System.

## Overview

LangSmith is integrated into the Node.js backend to monitor and visualize all LLM-related operations that use the Gemini 2.0 Flash API. This integration allows for:

- Tracking prompt history
- Monitoring model outputs
- Measuring latency
- Error tracking

## Modules Integrated with LangSmith

### 1. Document Processing Module (Input Extraction)
- When a user uploads a handwritten or digital document (Tamil/English), it is passed through OCR.
- Gemini is used to extract structured fields such as title, description, department, and location.
- Each Gemini extraction call is traced using LangSmith with:
  - Input: OCR text
  - Output: JSON fields
  - Metadata: { module: "DocumentExtraction", model: "gemini-2.0-flash" }

### 2. Priority Assignment Module
- The grievance text is passed to Gemini to determine the urgency (Low, Medium, High).
- Gemini returns both priority and explanation.
- This process is logged in LangSmith:
  - Input: Grievance description
  - Output: Priority + Explanation
  - Metadata: { module: "PriorityAssignment", model: "gemini-2.0-flash" }

### 3. Admin Chatbot (Smart Query Assistant)
- Admin types a natural language query (e.g. "Show escalated water cases in Madurai").
- Gemini interprets it and returns a structured intent + filters object.
- The backend converts it to a MongoDB query.
- Logged in LangSmith:
  - Input: Raw admin query
  - Output: Parsed intent and parameters
  - Metadata: { module: "AdminSmartQuery", model: "gemini-2.0-flash" }

## Configuration

The LangSmith integration is configured using the following environment variables:

```
LANGSMITH_API_KEY=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
LANGSMITH_PROJECT=pr-best-finer-66
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_TRACING=true
```

## Implementation Details

The integration is implemented using the `langsmith` NPM package. A utility function `tracedGeminiCall` is used to wrap all Gemini API calls with LangSmith tracing.

### Example Usage

```javascript
import { tracedGeminiCall } from '../utils/langsmithTracer.js';

// Example of using tracedGeminiCall
const result = await tracedGeminiCall(
    (input) => model.generateContent({
        contents: [{
            parts: [{ text: input }]
        }]
    }),
    "ModuleName",
    prompt,
    { metadata: { operation: "operation_name" } }
);
```

## Viewing Traces

Traces can be viewed in the LangSmith dashboard at https://smith.langchain.com/ under the project "pr-best-finer-66".

## Troubleshooting

If LangSmith tracing is not working:

1. Check that the environment variables are correctly set
2. Verify that `LANGSMITH_TRACING` is set to "true"
3. Check the console for any errors related to LangSmith
4. Ensure that the Gemini API key is valid and has sufficient quota 