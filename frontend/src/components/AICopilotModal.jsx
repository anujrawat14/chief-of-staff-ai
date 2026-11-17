import React, { useState } from 'react';
import { Sparkles, Send, X, MailPlus, Loader2 } from 'lucide-react';
import { askInboxAI, simulateIncomingEmail } from '../api';

const QUICK_PROMPTS = [
    'Show me emails that need my attention.',
    'Which emails require the client’s attention?',
    'What am I waiting for a response on?',
    'Summarize upcoming meetings and deadlines.'
];

export function AICopilotDrawer({ isOpen, onClose }) {
    const [messages, setMessages] = useState([
        {
            role: 'ai',
            text: 'Hi! Ask me anything about your client’s inbox—priorities, pending follow-ups, deadlines, or why an email was routed to the client.'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleAsk = async (questionText) => {
        const q = questionText || input;
        if (!q.trim() || loading) return;

        setMessages((prev) => [...prev, { role: 'user', text: q }]);
        setInput('');
        setLoading(true);

        try {
            const { data } = await askInboxAI(q);
            setMessages((prev) => [...prev, { role: 'ai', text: data.answer }]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: 'ai', text: 'Could not reach the AI service right now. Please try again.' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex justify-end z-50">
            <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 text-white">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-sm">Inbox AI Copilot</h3>
                            <p className="text-[11px] text-slate-400">Live context across all active threads</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1.5">
                    {QUICK_PROMPTS.map((q) => (
                        <button
                            key={q}
                            onClick={() => handleAsk(q)}
                            className="text-[11px] font-medium bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 px-2.5 py-1 rounded-full transition cursor-pointer"
                        >
                            {q}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((m, idx) => (
                        <div
                            key={idx}
                            className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${m.role === 'user'
                                    ? 'bg-slate-900 text-white ml-8'
                                    : 'bg-slate-100 text-slate-800 mr-6 border border-slate-200/60'
                                }`}
                        >
                            {m.text}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                            <span>Analyzing inbox threads...</span>
                        </div>
                    )}
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAsk();
                    }}
                    className="p-3 border-t border-slate-200 flex gap-2"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about deadlines, pending replies..."
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white cursor-pointer"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}

const PRESETS = [
    {
        label: 'Board Dinner (Client)',
        senderName: 'Nandan Nilekani Office',
        senderEmail: 'office@ekstep.example.org',
        subject: 'Private Founders Dinner – Nov 25 at Taj Mahal Palace',
        body: 'Hi Arjun, Nandan is hosting an intimate 8-person founders dinner next Wednesday at 8 PM. Would love to know if you can join personally.'
    },
    {
        label: 'Flight Meal (Assistant)',
        senderName: 'MakeMyTrip Corporate Desk',
        senderEmail: 'corp-travel@mmt.example.com',
        subject: 'Action Needed: Select Meal & Lounge Preference for BLR Trip',
        body: 'Hello team, please confirm vegetarian/non-vegetarian meal preference and airport transfer pickup time for Mr. Arjun Mehta’s Nov 22 flight.'
    },
    {
        label: 'Newsletter (No Reply)',
        senderName: 'Stratechery Daily',
        senderEmail: 'updates@stratechery.example.com',
        subject: 'The AI Infrastructure Shift – Weekly Digest',
        body: 'This week in tech: Hyperscaler capex continues to climb as inference workloads scale across enterprise SaaS...'
    }
];

export function SimulateEmailModal({ isOpen, onClose, conversations, onCreated }) {
    const [mode, setMode] = useState('new');
    const [threadId, setThreadId] = useState('');
    const [senderName, setSenderName] = useState('');
    const [senderEmail, setSenderEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [provider, setProvider] = useState('Gmail');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const applyPreset = (p) => {
        setMode('new');
        setSenderName(p.senderName);
        setSenderEmail(p.senderEmail);
        setSubject(p.subject);
        setBody(p.body);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload =
                mode === 'reply_existing'
                    ? { threadId, senderName, senderEmail, body }
                    : { senderName, senderEmail, subject, body, provider };

            const { data } = await simulateIncomingEmail(payload);
            onCreated(data);
            onClose();
            setSenderName('');
            setSenderEmail('');
            setSubject('');
            setBody('');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MailPlus className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-display font-bold text-slate-900 text-base">
                            Simulate Incoming Email
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-xs text-slate-500">
                    Inject a new email or reply to an existing thread to trigger live Gemini AI classification.
                </p>

                <div className="flex flex-wrap gap-1.5">
                    {PRESETS.map((p) => (
                        <button
                            key={p.label}
                            type="button"
                            onClick={() => applyPreset(p)}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                        >
                            + {p.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setMode('new')}
                        className={`py-1.5 rounded-lg cursor-pointer ${mode === 'new' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                            }`}
                    >
                        New Conversation
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('reply_existing')}
                        className={`py-1.5 rounded-lg cursor-pointer ${mode === 'reply_existing' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                            }`}
                    >
                        Reply to Existing Thread
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    {mode === 'reply_existing' ? (
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Thread</label>
                            <select
                                required
                                value={threadId}
                                onChange={(e) => setThreadId(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                            >
                                <option value="">-- Choose existing thread --</option>
                                {conversations.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.subject} ({c.responsibility})
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Inbox</label>
                                <select
                                    value={provider}
                                    onChange={(e) => setProvider(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                                >
                                    <option value="Gmail">Gmail</option>
                                    <option value="Outlook">Outlook</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Sender Name</label>
                            <input
                                type="text"
                                required
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Sender Email</label>
                            <input
                                type="email"
                                required
                                value={senderEmail}
                                onChange={(e) => setSenderEmail(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Email Message</label>
                        <textarea
                            rows={3}
                            required
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 p-3 text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Running Gemini AI Triage...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                <span>Deliver & Classify with AI</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}