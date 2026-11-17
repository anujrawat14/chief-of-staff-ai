import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Conversation from './models/conversation.js';
import { classifyThread, generateReplyDraft, queryInbox } from './services/aiService.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// 1. Get all conversations + dashboard KPI stats
app.get('/api/emails', async (req, res) => {
    try {
        const { responsibility, category, search, archived } = req.query;
        const filter = { isArchived: archived === 'true' };

        if (responsibility && responsibility !== 'All') filter.responsibility = responsibility;
        if (category && category !== 'All') filter.category = category;
        if (search) {
            filter.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { aiSummary: { $regex: search, $options: 'i' } },
                { 'messages.senderName': { $regex: search, $options: 'i' } },
                { 'messages.body': { $regex: search, $options: 'i' } }
            ];
        }

        const conversations = await Conversation.find(filter).sort({ updatedAt: -1 });
        const allActive = await Conversation.find({ isArchived: false });

        const stats = {
            total: allActive.length,
            unread: allActive.filter((c) => c.isUnread).length,
            important: allActive.filter((c) => c.isImportant).length,
            assistantToReply: allActive.filter((c) => c.responsibility === 'Assistant to Reply').length,
            clientToReply: allActive.filter((c) => c.responsibility === 'Client to Reply').length,
            needsReview: allActive.filter((c) => c.responsibility === 'Needs Review').length,
            waitingForResponse: allActive.filter((c) => c.category === 'Waiting for Response').length,
            upcomingMeetings: allActive.filter((c) => c.extractedDate && c.extractedDate.length > 0)
        };

        res.json({ conversations, stats });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Simulate incoming email OR append message to existing thread & re-classify with AI
app.post('/api/emails/simulate', async (req, res) => {
    try {
        const { threadId, subject, senderName, senderEmail, body, provider = 'Gmail' } = req.body;
        let conversation;

        if (threadId) {
            conversation = await Conversation.findById(threadId);
            conversation.messages.push({ senderName, senderEmail, body, role: 'external' });
            conversation.isUnread = true;
            conversation.isCompleted = false;
        } else {
            conversation = new Conversation({
                subject,
                provider,
                messages: [{ senderName, senderEmail, body, role: 'external' }]
            });
        }

        // Live AI classification on the full conversation history
        const aiResult = await classifyThread(conversation.subject, conversation.messages);
        Object.assign(conversation, aiResult);

        await conversation.save();
        res.status(201).json(conversation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Update conversation (Manual override, Client delegation, Mark handled/unread/archived)
app.patch('/api/emails/:id', async (req, res) => {
    try {
        const updated = await Conversation.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Generate AI Reply Draft
app.post('/api/emails/:id/draft-reply', async (req, res) => {
    try {
        const { persona } = req.body;
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ error: 'Thread not found' });

        const draft = await generateReplyDraft(conversation, persona);
        res.json({ draft });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Send Approved Reply (Human-in-the-loop confirmation)
app.post('/api/emails/:id/send-reply', async (req, res) => {
    try {
        const { body, senderRole = 'assistant' } = req.body;
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ error: 'Thread not found' });

        conversation.messages.push({
            senderName: senderRole === 'assistant' ? 'Anuj (EA to Arjun)' : 'Arjun Mehta',
            senderEmail: senderRole === 'assistant' ? 'anuj.ea@nexusventures.in' : 'arjun.mehta@nexusventures.in',
            body,
            role: senderRole
        });

        conversation.responsibility = 'No Reply Needed';
        conversation.category = 'Waiting for Response';
        conversation.isUnread = false;
        conversation.aiReasoning = `Replied by ${senderRole === 'assistant' ? 'Personal Assistant' : 'Client'} — awaiting external response.`;

        await conversation.save();
        res.json(conversation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Ask Inbox AI Copilot
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { question } = req.body;
        const conversations = await Conversation.find({ isArchived: false });
        const answer = await queryInbox(question, conversations);
        res.json({ answer });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));