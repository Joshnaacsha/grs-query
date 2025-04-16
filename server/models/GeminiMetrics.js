import mongoose from 'mongoose';

const geminiMetricsSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now
    },
    operation: {
        type: String,
        required: true
    },
    latency: {
        type: Number, // in milliseconds
        required: true
    },
    success: {
        type: Boolean,
        required: true
    },
    errorMessage: {
        type: String
    },
    inputTokens: {
        type: Number
    },
    outputTokens: {
        type: Number
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
});

// Add indexes for efficient querying
geminiMetricsSchema.index({ timestamp: -1 });
geminiMetricsSchema.index({ operation: 1 });

// Add methods to calculate statistics
geminiMetricsSchema.statics.getStats = async function (timeRange = '24h') {
    const timeFilter = {};
    if (timeRange) {
        const now = new Date();
        const hours = parseInt(timeRange);
        timeFilter.timestamp = {
            $gte: new Date(now - hours * 60 * 60 * 1000)
        };
    }

    const metrics = await this.find(timeFilter);

    if (!metrics.length) {
        return {
            totalCalls: 0,
            successRate: 0,
            averageLatency: 0,
            p95Latency: 0,
            p99Latency: 0,
            operationBreakdown: {}
        };
    }

    const totalCalls = metrics.length;
    const successfulCalls = metrics.filter(m => m.success).length;
    const latencies = metrics.map(m => m.latency).sort((a, b) => a - b);

    // Calculate percentiles
    const p95Index = Math.floor(latencies.length * 0.95);
    const p99Index = Math.floor(latencies.length * 0.99);

    // Group by operation
    const operationBreakdown = {};
    metrics.forEach(metric => {
        if (!operationBreakdown[metric.operation]) {
            operationBreakdown[metric.operation] = {
                total: 0,
                successful: 0,
                averageLatency: 0
            };
        }

        const op = operationBreakdown[metric.operation];
        op.total++;
        if (metric.success) op.successful++;
        op.averageLatency = (op.averageLatency * (op.total - 1) + metric.latency) / op.total;
    });

    return {
        totalCalls,
        successRate: (successfulCalls / totalCalls) * 100,
        averageLatency: latencies.reduce((a, b) => a + b, 0) / totalCalls,
        p95Latency: latencies[p95Index],
        p99Latency: latencies[p99Index],
        operationBreakdown
    };
};

const GeminiMetrics = mongoose.model('GeminiMetrics', geminiMetricsSchema);

export default GeminiMetrics; 