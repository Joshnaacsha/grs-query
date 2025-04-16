import GeminiMetrics from '../models/GeminiMetrics.js';

/**
 * Get Gemini API metrics for a specified time range
 */
export async function getGeminiMetrics(req, res) {
    try {
        const { timeRange = '24h' } = req.query;

        // Convert timeRange to milliseconds
        const timeRangeMap = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };

        const since = new Date(Date.now() - (timeRangeMap[timeRange] || timeRangeMap['24h']));

        // Get all metrics for the time range
        const metrics = await GeminiMetrics.find({
            timestamp: { $gte: since }
        }).sort('timestamp');

        // Group metrics by time intervals
        const intervalMs = timeRange === '1h' ? 5 * 60 * 1000 : // 5 minutes for 1h
            timeRange === '24h' ? 30 * 60 * 1000 : // 30 minutes for 24h
                timeRange === '7d' ? 3 * 60 * 60 * 1000 : // 3 hours for 7d
                    6 * 60 * 60 * 1000; // 6 hours for 30d

        const timeSeriesData = [];
        let currentInterval = new Date(since);
        const now = new Date();

        while (currentInterval <= now) {
            const intervalEnd = new Date(currentInterval.getTime() + intervalMs);
            const intervalMetrics = metrics.filter(m =>
                m.timestamp >= currentInterval && m.timestamp < intervalEnd
            );

            if (intervalMetrics.length > 0) {
                const successfulCalls = intervalMetrics.filter(m => m.success).length;
                const latencies = intervalMetrics.map(m => m.latency).sort((a, b) => a - b);
                const p95Index = Math.floor(latencies.length * 0.95);
                const p99Index = Math.floor(latencies.length * 0.99);

                timeSeriesData.push({
                    timestamp: currentInterval.toISOString(),
                    totalCalls: intervalMetrics.length,
                    successRate: (successfulCalls / intervalMetrics.length) * 100,
                    averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
                    p95Latency: latencies[p95Index] || 0,
                    p99Latency: latencies[p99Index] || 0
                });
            }

            currentInterval = intervalEnd;
        }

        // Get recent errors for debugging
        const recentErrors = await GeminiMetrics.find({
            success: false,
            timestamp: { $gte: since }
        })
            .select('operation errorMessage timestamp')
            .sort('-timestamp')
            .limit(10);

        // Calculate overall stats
        const totalMetrics = metrics.length;
        const successfulMetrics = metrics.filter(m => m.success).length;
        const allLatencies = metrics.map(m => m.latency).sort((a, b) => a - b);
        const p95Index = Math.floor(allLatencies.length * 0.95);
        const p99Index = Math.floor(allLatencies.length * 0.99);

        const stats = {
            totalCalls: totalMetrics,
            successRate: totalMetrics ? (successfulMetrics / totalMetrics) * 100 : 0,
            averageLatency: totalMetrics ? allLatencies.reduce((a, b) => a + b, 0) / totalMetrics : 0,
            p95Latency: allLatencies[p95Index] || 0,
            p99Latency: allLatencies[p99Index] || 0
        };

        res.json({
            timeRange,
            timeSeriesData,
            stats,
            recentErrors
        });
    } catch (error) {
        console.error('[Metrics] Failed to fetch metrics:', error);
        res.status(500).json({
            error: 'Failed to fetch metrics',
            details: error.message
        });
    }
} 