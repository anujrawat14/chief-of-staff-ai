import React, { useState } from 'react';
import {
    CheckCircle2,
    UserPlus,
    MessageSquare,
    Calendar,
    Sparkles,
    X,
    Send
} from 'lucide-react';
import { updateEmail, draftAIReply, sendApprovedReply } from '../api';

export default function ClientView({ conversations, clientName, assistantName, onRefresh }) {
    const [selectedThread, setSelectedThread] = useState(null);
    const [delegateModal, setDelegateModal] = useState(null);
    const [delegateNote, setDelegateNote] = useState('');
    const [replyDraft, setReplyDraft] = useState('');
    const [loadingDraft, setLoadingDraft] = useState(false);
    const [sending, setSending] = useState(false);

    const clientEmails = conversations.filter(
        (c) => c.responsibility === 'Client to Reply' && !c.isArchived && !c.isCompleted
    );

    const handleMarkHandled = async (id) => {
        await updateEmail(id, {
            responsibility: 'No Reply Needed',
            isCompleted: true,
            isUnread: false,
            aiReasoning: `Marked as handled directly by ${clientName}.`
        });
        if (selectedThread?._id === id) setSelectedThread(null);
        onRefresh();
    };

    const handleDelegateSubmit = async (e) => {
        e.preventDefault();
        if (!delegateModal) return;

        await updateEmail(delegateModal._id, {
            responsibility: 'Assistant to Reply',
            category: 'Action Required',
            clientNote: delegateNote || 'Client asked you to handle this response.',
            aiReasoning: `Delegated by ${clientName}${delegateNote ? `: "${delegateNote}"` : '.'}`
        });

        setDelegateModal(null);
        setDelegateNote('');
        setSelectedThread(null);
        onRefresh();
    };

    const handleGenerateClientDraft = async (thread) => {
        setLoadingDraft(true);
        try {
            const { data } = await draftAIReply(thread._id, 'client');
            setReplyDraft(data.draft);
        } finally {
            setLoadingDraft(false);
        }
    };

    const handleSendDirectReply = async (threadId) => {
        if (!replyDraft.trim()) return;
        setSending(true);
        try {
            await sendApprovedReply(threadId, replyDraft, 'client');
            setReplyDraft('');
            setSelectedThread(null);
            onRefresh();
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-10">
            {/* Executive Header Card */}
            <div className="bg-slate-900 text-white rounded-3xl p-7 mb-8 border border-slate-800 shadow-lg relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-1.5">
                    Executive Priority Brief
                </p>
                <h1 className="font-display text-2xl font-extrabold tracking-tight">
                    Welcome back, {clientName}
                </h1>
                <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
                    {clientEmails.length === 0
                        ? `Your executive queue is clear. ${assistantName} is managing all routine threads.`
                        : `${assistantName} triaged your inbox and surfaced ${clientEmails.length} ${clientEmails.length === 1 ? 'decision' : 'decisions'
                        } requiring your personal sign-off.`}
                </p>
            </div>

            {/* Empty State */}
            {clientEmails.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3.5">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-900">
                        Zero pending executive replies
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                        All scheduling, vendor follow-ups, and updates are handled in the Assistant Workspace.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {clientEmails.map((email) => {
                        const latestMsg = email.messages[email.messages.length - 1];
                        return (
                            <div
                                key={email._id}
                                className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs hover:border-emerald-400 transition"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mb-2">
                                    <span className="font-semibold text-slate-900">
                                        {latestMsg?.senderName}{' '}
                                        <span className="font-normal text-slate-400">&lt;{latestMsg?.senderEmail}&gt;</span>
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                                            {email.provider}
                                        </span>
                                        <span>
                                            {new Date(latestMsg?.timestamp || email.updatedAt).toLocaleDateString([], {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>

                                <h2 className="font-display text-lg font-bold text-slate-900 mb-2">
                                    {email.subject}
                                </h2>
                                <p className="text-sm text-slate-600 leading-relaxed mb-4">{email.aiSummary}</p>

                                {/* Why Client's Response is Needed */}
                                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 mb-5 flex items-start gap-3">
                                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <div className="text-xs leading-relaxed">
                                        <span className="font-bold text-emerald-950">Why your input is needed: </span>
                                        <span className="text-emerald-900">{email.aiReasoning}</span>
                                        {email.extractedDate && (
                                            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white border border-emerald-200 text-emerald-800 font-semibold">
                                                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Timeline: {email.extractedDate}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Row */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-slate-100">
                                    <button
                                        onClick={() => {
                                            setSelectedThread(email);
                                            setReplyDraft('');
                                        }}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 cursor-pointer"
                                    >
                                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                                        <span>Review Original Thread ({email.messages.length})</span>
                                    </button>

                                    <div className="flex items-center gap-2.5">
                                        <button
                                            onClick={() => setDelegateModal(email)}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-800 transition cursor-pointer"
                                        >
                                            <UserPlus className="w-3.5 h-3.5" />
                                            <span>Delegate to {assistantName}</span>
                                        </button>

                                        <button
                                            onClick={() => handleMarkHandled(email._id)}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Mark Handled</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Original Conversation Modal */}
            {selectedThread && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                            <div>
                                <h3 className="font-display font-bold text-base">{selectedThread.subject}</h3>
                                <p className="text-xs text-slate-300 mt-0.5">{selectedThread.aiReasoning}</p>
                            </div>
                            <button
                                onClick={() => setSelectedThread(null)}
                                className="p-1.5 rounded-xl text-slate-400 hover:bg-white/10 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50">
                            {selectedThread.messages.map((msg, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                                    <div className="flex justify-between text-xs text-slate-500 mb-2">
                                        <span className="font-bold text-slate-900">{msg.senderName}</span>
                                        <span>{new Date(msg.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                                        {msg.body}
                                    </p>
                                </div>
                            ))}

                            <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800">Reply Personally</span>
                                    <button
                                        onClick={() => handleGenerateClientDraft(selectedThread)}
                                        disabled={loadingDraft}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>{loadingDraft ? 'Drafting...' : 'AI Draft Executive Reply'}</span>
                                    </button>
                                </div>

                                <textarea
                                    rows={3}
                                    value={replyDraft}
                                    onChange={(e) => setReplyDraft(e.target.value)}
                                    placeholder="Write your response or click AI Draft..."
                                    className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />

                                <div className="flex justify-end">
                                    <button
                                        onClick={() => handleSendDirectReply(selectedThread._id)}
                                        disabled={sending || !replyDraft.trim()}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        <span>{sending ? 'Sending...' : 'Approve & Send Reply'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delegate Modal */}
            {delegateModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <form
                        onSubmit={handleDelegateSubmit}
                        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
                    >
                        <h3 className="font-display font-bold text-slate-900 text-base">
                            Hand over to {assistantName}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            This moves <strong>"{delegateModal.subject}"</strong> into {assistantName}’s action queue. Add quick instructions if needed:
                        </p>
                        <textarea
                            rows={3}
                            value={delegateNote}
                            onChange={(e) => setDelegateNote(e.target.value)}
                            placeholder="e.g., Tell Priya we approve Section 4.2 and ask her to send the DocuSign."
                            className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDelegateModal(null)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                            >
                                Assign to {assistantName}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}