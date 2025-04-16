import { Client } from "langsmith";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Print environment status
console.log('\nEnvironment Check:');
console.log('API Key:', process.env.LANGSMITH_API_KEY ? '✓ Set' : '✗ Not Set');
console.log('Project:', process.env.LANGSMITH_PROJECT || 'Not Set');
console.log('Endpoint:', process.env.LANGSMITH_ENDPOINT || 'Not Set');
console.log('Tracing:', process.env.LANGSMITH_TRACING || 'Not Set');

// Initialize client
const client = new Client({
    apiKey: process.env.LANGSMITH_API_KEY,
    projectName: process.env.LANGSMITH_PROJECT,
    apiUrl: process.env.LANGSMITH_ENDPOINT
});

async function testLangSmith() {
    try {
        console.log('\nTesting LangSmith Connection...');

        // Create a test run
        console.log('Creating test run...');
        const run = await client.createRun({
            name: "Test-Connection",
            run_type: "llm",
            start_time: new Date().toISOString(),
            status: "in_progress",
            inputs: { test: "test" }
        });

        console.log('Run created:', run.id);

        // Update the run as completed
        console.log('Updating run...');
        await client.updateRun(run.id, {
            status: "completed",
            end_time: new Date().toISOString(),
            outputs: { result: "test complete" }
        });

        console.log('Run completed');

        // Flush data
        console.log('Flushing data...');
        await client.flush();
        console.log('Data flushed');

        console.log('\n✅ Test successful!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed!');
        console.error('Error:', error.message);
        if (error.response?.data) {
            console.error('Response:', error.response.data);
        }
        process.exit(1);
    }
}

testLangSmith(); 