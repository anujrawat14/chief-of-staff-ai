import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderName: { type: String, required: true },
    senderEmail: { type: String, required: true },
    body: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    role: { type: String, enum: ['external', 'client', 'assistant'], default: 'external' }
});

const conversationSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    provider: { type: String, enum: ['Gmail', 'Outlook'], default: 'Gmail' },
    clientEmail: { type: String, default: 'arjun.mehta@nexusventures.in' },
    messages: [messageSchema],

    // AI Classification & Intelligence
    responsibility: {
        type: String,
        enum: ['Assistant to Reply', 'Client to Reply', 'No Reply Needed', 'Needs Review'],
        default: 'Needs Review'
    },
    confidenceScore: { type: Number, min: 0, max: 1, default: 0.5 },
    aiReasoning: { type: String, default: '' },
    aiSummary: { type: String, default: '' },
    extractedAction: { type: String, default: '' },
    extractedDate: { type: String, default: '' },

    // Organization & State
    category: {
        type: String,
        enum: ['Action Required', 'Waiting for Response', 'Meetings & Appointments', 'Important', 'General'],
        default: 'General'
    },
    isUnread: { type: Boolean, default: true },
    isImportant: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    clientNote: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Conversation', conversationSchema);