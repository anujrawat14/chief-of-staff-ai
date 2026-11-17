import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export const fetchEmails = (params) => API.get('/emails', { params });
export const simulateIncomingEmail = (payload) => API.post('/emails/simulate', payload);
export const updateEmail = (id, updates) => API.patch(`/emails/${id}`, updates);
export const draftAIReply = (id, persona) => API.post(`/emails/${id}/draft-reply`, { persona });
export const sendApprovedReply = (id, body, senderRole) =>
    API.post(`/emails/${id}/send-reply`, { body, senderRole });
export const askInboxAI = (question) => API.post('/ai/chat', { question });