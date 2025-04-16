import express from 'express';
import { getGeminiMetrics } from '../controllers/metricsController.js';
import { authenticateToken } from '../middleware/auth.js';
import GeminiMetrics from '../models/GeminiMetrics.js';

const router = express.Router();

// Get Gemini API metrics (protected route)
router.get('/gemini', authenticateToken, getGeminiMetrics);

// Test endpoint to generate sample metrics (development only)
router.post('/test', authenticateToken, async (req, res) => {
    try {
        // Clear existing metrics first
        await GeminiMetrics.deleteMany({});

        const testMetrics = [];
        const operations = ['query-generation', 'intent-classification', 'parameter-extraction'];

        // Generate 24 hours of data with 15-minute intervals
        const now = Date.now();
        const hours24 = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const interval = 15 * 60 * 1000; // 15 minutes in milliseconds
        const dataPoints = hours24 / interval; // 96 points for 24 hours

        // Predefined patterns for more realistic data
        const baseLatencyPatterns = [
            // Morning (lower latency, stable)
            1000, 1100, 1050, 1150, 1200, 1100, 1150, 1200, 1100, 1050, 1100, 1150,
            // Afternoon (medium latency, some variation)
            1200, 1300, 1400, 1350, 1300, 1400, 1450, 1400, 1350, 1300, 1250, 1300,
            // Evening (higher latency, more variation)
            1400, 1500, 1600, 1550, 1500, 1600, 1650, 1600, 1550, 1500, 1450, 1500,
            // Night (lowest latency, very stable)
            900, 950, 1000, 950, 900, 950, 1000, 950, 900, 850, 900, 950
        ];

        // Calculate p95 and p99 based on base latency
        const calculatePercentiles = (baseLatency) => {
            // P95 is typically 40-60% higher than average
            const p95Multiplier = 1.5 + (Math.random() * 0.2); // 1.5-1.7x
            // P99 is typically 80-120% higher than average
            const p99Multiplier = 2.0 + (Math.random() * 0.4); // 2.0-2.4x

            return {
                p95: Math.round(baseLatency * p95Multiplier),
                p99: Math.round(baseLatency * p99Multiplier)
            };
        };

        for (let i = 0; i < dataPoints; i++) {
            const timestamp = new Date(now - (i * interval));
            const timeOfDay = Math.floor((i % 96) / 4); // 0-23 hour of day
            const patternIndex = timeOfDay % baseLatencyPatterns.length;

            // Get base latency for this time period
            const baseLatency = baseLatencyPatterns[patternIndex];

            // Calculate percentiles
            const { p95, p99 } = calculatePercentiles(baseLatency);

            // Create metrics for each operation type
            for (let j = 0; j < 3; j++) {
                const operation = operations[j];
                // Add some random variation to each metric
                const latencyVariation = Math.random() * 200 - 100; // ±100ms
                const p95Variation = Math.random() * 300 - 150; // ±150ms
                const p99Variation = Math.random() * 400 - 200; // ±200ms

                const metric = await GeminiMetrics.create({
                    timestamp,
                    operation,
                    latency: Math.floor(baseLatency + latencyVariation),
                    p95Latency: Math.floor(p95 + p95Variation),
                    p99Latency: Math.floor(p99 + p99Variation),
                    success: Math.random() * 100 <= 95, // 95% success rate
                    errorMessage: Math.random() * 100 <= 95 ? null : 'Test error message',
                    metadata: {
                        inputLength: Math.floor(1000 + Math.random() * 1000),
                        outputLength: Math.floor(2000 + Math.random() * 2000)
                    }
                });
                testMetrics.push(metric);
            }
        }

        console.log(`Created ${testMetrics.length} test metrics`);
        res.json({
            success: true,
            message: `Created ${testMetrics.length} test metrics`,
            sampleMetrics: testMetrics.slice(0, 5)
        });
    } catch (error) {
        console.error('Failed to create test metrics:', error);
        res.status(500).json({ error: error.message });
    }
});

// Clear all test metrics (development only)
router.delete('/test', authenticateToken, async (req, res) => {
    try {
        const result = await GeminiMetrics.deleteMany({});
        res.json({
            success: true,
            message: `Cleared ${result.deletedCount} test metrics`
        });
    } catch (error) {
        console.error('Failed to clear test metrics:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router; 