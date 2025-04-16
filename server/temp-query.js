import mongoose from 'mongoose';
const { Schema } = mongoose;

// Define the schema
const geminiMetricsSchema = new Schema({
    timestamp: {
        type: Date,
        default: Date.now
    },
    operation: {
        type: String,
        required: true
    },
    latency: {
        type: Number,
        required: true
    },
    success: {
        type: Boolean,
        required: true
    },
    errorMessage: String,
    metadata: {
        type: Map,
        of: Schema.Types.Mixed
    }
});

const GeminiMetrics = mongoose.model('GeminiMetrics', geminiMetricsSchema);

async function queryMetrics() {
    try {
        await mongoose.connect('mongodb://localhost:27017/grievance-system');
        console.log('Connected to MongoDB');

        const metrics = await GeminiMetrics.find({});
        console.log('Found metrics:', JSON.stringify(metrics, null, 2));

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

queryMetrics(); 