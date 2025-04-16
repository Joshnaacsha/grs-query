import { Client } from "langsmith";
import GeminiMetrics from '../models/GeminiMetrics.js';

// Initialize the LangSmith client
const client = new Client({
    apiKey: process.env.LANGSMITH_API_KEY,
    projectName: process.env.LANGSMITH_PROJECT,
    apiUrl: process.env.LANGSMITH_ENDPOINT
});

/**
 * Records metrics for a Gemini API call
 */
async function recordMetrics(operation, startTime, success, error = null, metadata = {}) {
    try {
        console.log('[Metrics] Recording metrics for operation:', operation);
        const endTime = Date.now();
        const latency = endTime - startTime;

        const metricData = {
            operation,
            latency,
            success,
            errorMessage: error?.message,
            metadata: {
                ...metadata,
                timestamp: new Date(startTime).toISOString()
            }
        };
        console.log('[Metrics] Metric data:', JSON.stringify(metricData, null, 2));

        const result = await GeminiMetrics.create(metricData);
        console.log('[Metrics] Successfully recorded metrics:', result._id);
    } catch (error) {
        console.error('[Metrics] Failed to record metrics:', error);
        // Log the full error stack for debugging
        if (error.stack) {
            console.error('[Metrics] Error stack:', error.stack);
        }
    }
}

/**
 * Wraps a Gemini API call with tracing and metrics
 */
export async function tracedGeminiCall(geminiCall, moduleName, input, options = {}) {
    const startTime = Date.now();
    let success = false;

    try {
        // Create a new run if tracing is enabled
        let runId = null;
        if (process.env.LANGSMITH_TRACING === 'true') {
            try {
                const run = await client.createRun({
                    name: `Gemini-${moduleName}`,
                    run_type: "llm",
                    inputs: { input },
                    start_time: new Date(startTime).toISOString(),
                    status: "in_progress"
                });
                runId = run?.id;
            } catch (error) {
                console.error('[LangSmith] Failed to create run:', error);
            }
        }

        // Execute the Gemini call
        const result = await geminiCall(input, options);
        success = true;

        // Update run if we have an ID
        if (runId) {
            try {
                await client.updateRun(runId, {
                    status: "completed",
                    end_time: new Date().toISOString(),
                    outputs: {
                        result: result.response?.text() || JSON.stringify(result)
                    }
                });
                await client.flush();
            } catch (error) {
                console.error('[LangSmith] Failed to update run:', error);
            }
        }

        // Record metrics
        await recordMetrics(moduleName, startTime, true, null, {
            inputLength: input?.length,
            outputLength: result.response?.text()?.length
        });

        return result;
    } catch (error) {
        // Record error metrics
        await recordMetrics(moduleName, startTime, false, error);
        throw error;
    }
}

// Export the client
export default client; 