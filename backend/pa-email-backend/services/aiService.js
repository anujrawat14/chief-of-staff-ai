import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemini-3.8-flash';

export async function classifyThread(subject, messages) {
    const threadText = messages
        .map((m) => `[${m.role.toUpperCase()}] ${m.senderName} <${m.senderEmail}>: ${m.body}`)
        .join('\n\n');

    const prompt = `
You are an executive AI chief-of-staff managing emails for a busy founder (Arjun Mehta) and his Personal Assistant (Anuj).
Analyze the entire email thread below and classify who should respond next.

Rules:
- "Assistant to Reply": Scheduling/rescheduling meetings, travel/logistics, routine vendor inquiries, administrative follow-ups, sending standard decks/info.
- "Client to Reply": Personal approvals, equity/legal/financial sign-offs, sensitive investor/board discussions, personal invitations, strategic decisions.
- "No Reply Needed": Newsletters, automated receipts/notifications, FYI updates, or threads where the client/assistant already sent the closing reply.
- If the email is ambiguous or lacks clear context, set confidenceScore below 0.75.

Subject: ${subject}
Conversation History:
${threadText}
`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        responsibility: {
                            type: Type.STRING,
                            enum: ['Assistant to Reply', 'Client to Reply', 'No Reply Needed']
                        },
                        confidenceScore: { type: Type.NUMBER },
                        aiReasoning: { type: Type.STRING },
                        aiSummary: { type: Type.STRING },
                        extractedAction: { type: Type.STRING },
                        extractedDate: { type: Type.STRING },
                        category: {
                            type: Type.STRING,
                            enum: ['Action Required', 'Waiting for Response', 'Meetings & Appointments', 'Important', 'General']
                        },
                        isImportant: { type: Type.BOOLEAN }
                    },
                    required: ['responsibility', 'confidenceScore', 'aiReasoning', 'aiSummary', 'category', 'isImportant']
                }
            }
        });

        const data = JSON.parse(response.text);

        if (data.confidenceScore < 0.75) {
            data.responsibility = 'Needs Review';
            data.aiReasoning = `Low confidence (${Math.round(data.confidenceScore * 100)}%): ${data.aiReasoning}`;
        }

        return data;
    } catch (error) {
        console.error('AI Classification Error:', error.message);
        return {
            responsibility: 'Needs Review',
            confidenceScore: 0.5,
            aiReasoning: 'AI service unavailable — flagged for manual assistant review.',
            aiSummary: `Email thread regarding "${subject}".`,
            extractedAction: 'Review thread manually',
            extractedDate: '',
            category: 'General',
            isImportant: false
        };
    }
}

export async function generateReplyDraft(conversation, persona = 'assistant') {
    const threadText = conversation.messages
        .map((m) => `${m.senderName}: ${m.body}`)
        .join('\n---\n');

    const roleInstruction =
        persona === 'assistant'
            ? 'Write as Anuj, Executive Assistant to Arjun Mehta. Be polite, concise, proactive, and professional.'
            : 'Write directly as Arjun Mehta (Founder & CEO). Keep it executive, warm, and decisive.';

    const prompt = `
${roleInstruction}
${conversation.clientNote ? `Client's specific instruction for this reply: "${conversation.clientNote}"` : ''}

Subject: ${conversation.subject}
Thread:
${threadText}

Write only the email body (no subject line, no markdown placeholders).
`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt
        });

        return response.text.trim();
    } catch (error) {
        console.error('AI Draft Error:', error.message);
        const lastSender = conversation.messages[conversation.messages.length - 1]?.senderName || 'there';
        return `Hi ${lastSender},\n\nThank you for reaching out regarding "${conversation.subject}". I am coordinating this on Arjun's behalf and will follow up with confirmed details shortly.\n\nBest regards,\nAnuj\nExecutive Assistant`;
    }
}

export async function queryInbox(question, conversations) {
    const compactInbox = conversations.map((c) => ({
        id: c._id,
        subject: c.subject,
        from: c.messages[c.messages.length - 1]?.senderName,
        responsibility: c.responsibility,
        category: c.category,
        summary: c.aiSummary,
        reasoning: c.aiReasoning,
        action: c.extractedAction,
        date: c.extractedDate,
        isUnread: c.isUnread
    }));

    const prompt = `
You are the AI Copilot inside a Personal Assistant Email Dashboard.
Answer the user's question concisely using ONLY the inbox data below. Reference specific email subjects and senders clearly.

Inbox Data:
${JSON.stringify(compactInbox, null, 2)}

User Question: ${question}
`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt
        });

        return response.text.trim();
    } catch (error) {
        console.error('AI Copilot Error:', error.message);
        return 'Unable to reach Gemini right now. Please check your active Assistant to Reply and Client to Reply queues for pending items.';
    }
}