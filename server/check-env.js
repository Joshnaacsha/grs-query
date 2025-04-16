import { Client } from "langsmith";
import dotenv from "dotenv";

dotenv.config();

console.log('Environment Variables:');
console.log('LANGSMITH_API_KEY:', process.env.LANGSMITH_API_KEY ? '✓ Set' : '✗ Not Set');
console.log('LANGSMITH_PROJECT:', process.env.LANGSMITH_PROJECT ? '✓ Set' : '✗ Not Set');
console.log('LANGSMITH_ENDPOINT:', process.env.LANGSMITH_ENDPOINT ? '✓ Set' : '✗ Not Set');

const client = new Client({
    apiKey: process.env.LANGSMITH_API_KEY,
    projectName: process.env.LANGSMITH_PROJECT,
    apiUrl: process.env.LANGSMITH_ENDPOINT
});

async function testConnection() {
    try {
        const run = await client.createRun({
            name: "Test-Connection",
            run_type: "llm",
            inputs: { test: "test" },
            start_time: new Date().toISOString()
        });
        console.log('\nLangSmith Connection Test:');
        console.log('Created test run with ID:', run.id);

        await client.updateRun(run.id, {
            end_time: new Date().toISOString(),
            outputs: { result: "test complete" }
        });
        console.log('Successfully updated run');

        await client.flush();
        console.log('Successfully flushed data');

        process.exit(0);
    } catch (error) {
        console.error('\nLangSmith Connection Error:', error);
        process.exit(1);
    }
}

testConnection(); 