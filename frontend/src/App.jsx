import React, { useEffect, useState, useCallback } from 'react';
import {
  Inbox,
  UserCheck,
  User,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Star,
  Archive,
  Search,
  Sparkles,
  Send,
  MailPlus,
  RefreshCw,
  CheckCircle2,
  MailOpen,
  SlidersHorizontal,
  ShieldCheck,
  X
} from 'lucide-react';
import {
  fetchEmails,
  updateEmail,
  draftAIReply,
  sendApprovedReply
} from './api';
import Onboarding from './components/Onboarding';
import ClientView from './components/ClientView';
import { AICopilotDrawer, SimulateEmailModal } from './components/AICopilotModal';

const RESPONSIBILITY_STYLES = {
  'Assistant to Reply': {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    border: 'border-l-emerald-500'
  },
  'Client to Reply': {
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    border: 'border-l-amber-500'
  },
  'No Reply Needed': {
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    border: 'border-l-slate-300'
  },
  'Needs Review': {
    badge: 'bg-rose-50 text-rose-800 border-rose-200',
    border: 'border-l-rose-500'
  }
};

const AVATAR_COLORS = [
  'bg-emerald-100 text-emerald-800',
  'bg-slate-800 text-emerald-300',
  'bg-teal-100 text-teal-800',
  'bg-amber-100 text-amber-800',
  'bg-cyan-100 text-cyan-800'
];

function getInitials(name = 'U') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function App() {
  const [workspace, setWorkspace] = useState(null);
  const [viewMode, setViewMode] = useState('assistant');

  const [conversations, setConversations] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    important: 0,
    assistantToReply: 0,
    clientToReply: 0,
    needsReview: 0,
    waitingForResponse: 0,
    upcomingMeetings: []
  });

  const [activeTab, setActiveTab] = useState({ type: 'all', value: 'All', label: 'All Active Inbox' });
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reply Composer
  const [replyDraft, setReplyDraft] = useState('');
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // Modals & Toasts
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [accountsModalOpen, setAccountsModalOpen] = useState(false);
  const [syncingAccount, setSyncingAccount] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { search };
      if (activeTab.type === 'responsibility') params.responsibility = activeTab.value;
      if (activeTab.type === 'category') params.category = activeTab.value;
      if (activeTab.type === 'archived') params.archived = 'true';

      const { data } = await fetchEmails(params);
      setConversations(data.conversations);
      setStats(data.stats);

      if (data.conversations.length > 0) {
        setSelectedId((prev) =>
          data.conversations.some((c) => c._id === prev) ? prev : data.conversations[0]._id
        );
      } else {
        setSelectedId(null);
      }
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    if (workspace) {
      loadData();
    }
  }, [workspace, loadData]);

  if (!workspace) {
    return (
      <Onboarding
        onComplete={(config) => {
          setWorkspace(config);
          showToast('Workspace ready & AI inbox triage active.');
        }}
      />
    );
  }

  const selectedEmail = conversations.find((c) => c._id === selectedId);

  const handleSelectEmail = async (email) => {
    setSelectedId(email._id);
    setReplyDraft('');
    if (email.isUnread) {
      await updateEmail(email._id, { isUnread: false });
      loadData();
    }
  };

  const handleManualClassify = async (id, newResponsibility) => {
    await updateEmail(id, {
      responsibility: newResponsibility,
      aiReasoning: `Manually assigned to "${newResponsibility}" by ${workspace.assistantName}.`
    });
    showToast(`Reclassified as "${newResponsibility}"`);
    loadData();
  };

  const handleToggleFlag = async (id, field, currentVal, label) => {
    await updateEmail(id, { [field]: !currentVal });
    showToast(label);
    loadData();
  };

  const handleDraftReply = async () => {
    if (!selectedEmail) return;
    setGeneratingDraft(true);
    try {
      const { data } = await draftAIReply(selectedEmail._id, 'assistant');
      setReplyDraft(data.draft);
    } finally {
      setGeneratingDraft(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedEmail || !replyDraft.trim()) return;
    setSendingReply(true);
    try {
      await sendApprovedReply(selectedEmail._id, replyDraft, 'assistant');
      setReplyDraft('');
      showToast('Reply approved & sent!');
      loadData();
    } finally {
      setSendingReply(false);
    }
  };

  const handleManualSync = async () => {
    setSyncingAccount(true);
    await loadData();
    setTimeout(() => {
      setSyncingAccount(false);
      showToast('Gmail & Outlook inboxes re-synced with Gemini AI.');
    }, 600);
  };

  const sidebarItems = [
    { type: 'all', value: 'All', label: 'All Active Inbox', icon: Inbox, count: stats.total },
    {
      type: 'responsibility',
      value: 'Assistant to Reply',
      label: 'Assistant to Reply',
      icon: UserCheck,
      count: stats.assistantToReply
    },
    {
      type: 'responsibility',
      value: 'Client to Reply',
      label: 'Client to Reply',
      icon: User,
      count: stats.clientToReply
    },
    {
      type: 'responsibility',
      value: 'Needs Review',
      label: 'Needs Review',
      icon: AlertTriangle,
      count: stats.needsReview
    },
    {
      type: 'responsibility',
      value: 'No Reply Needed',
      label: 'No Reply Needed',
      icon: CheckCircle
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f5f8] text-slate-900">
      {/* Deep Slate Executive Header */}
      <header className="bg-[#0b1120] text-white border-b border-slate-800 px-4 lg:px-6 h-16 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center font-display font-extrabold text-sm shadow-sm">
            CS
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-display font-bold text-sm sm:text-base tracking-tight text-white">
                ChiefOfStaff<span className="text-emerald-400">.ai</span>
              </span>
              <button
                onClick={() => setAccountsModalOpen(true)}
                className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>2 Inboxes Synced</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Executive Principal: <strong className="text-slate-200">{workspace.clientName}</strong>
            </p>
          </div>
        </div>

        {/* Role Switcher Pill */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('assistant')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === 'assistant'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Assistant View
          </button>
          <button
            onClick={() => setViewMode('client')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'client'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Client View</span>
            {stats.clientToReply > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold">
                {stats.clientToReply}
              </span>
            )}
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {viewMode === 'assistant' && (
            <button
              onClick={() => setSimulateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:border-emerald-500/50 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition cursor-pointer"
            >
              <MailPlus className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Simulate Email</span>
            </button>
          )}
          <button
            onClick={() => setCopilotOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask Inbox AI</span>
          </button>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 border border-emerald-500/40">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {viewMode === 'client' ? (
        <ClientView
          conversations={conversations}
          clientName={workspace.clientName}
          assistantName={workspace.assistantName}
          onRefresh={loadData}
        />
      ) : (
        <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 lg:px-6 py-5 space-y-5">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <button
              onClick={() =>
                setActiveTab({
                  type: 'responsibility',
                  value: 'Assistant to Reply',
                  label: 'Assistant to Reply'
                })
              }
              className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-emerald-500 hover:shadow-sm text-left transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
                <span>Assistant Queue</span>
                <span className="p-1.5 rounded-lg bg-slate-900 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <UserCheck className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="font-display text-2xl font-extrabold text-slate-900">
                {stats.assistantToReply}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Routed to {workspace.assistantName}</p>
            </button>

            <button
              onClick={() =>
                setActiveTab({
                  type: 'responsibility',
                  value: 'Client to Reply',
                  label: 'Client to Reply'
                })
              }
              className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-amber-500 hover:shadow-sm text-left transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
                <span>Client Attention</span>
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition">
                  <User className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="font-display text-2xl font-extrabold text-amber-600">
                {stats.clientToReply}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Synced to Client View</p>
            </button>

            <button
              onClick={() =>
                setActiveTab({
                  type: 'responsibility',
                  value: 'Needs Review',
                  label: 'Needs Review'
                })
              }
              className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-rose-500 hover:shadow-sm text-left transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
                <span>Needs Review</span>
                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="font-display text-2xl font-extrabold text-rose-600">
                {stats.needsReview}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Low AI confidence (&lt;75%)</p>
            </button>

            <button
              onClick={() =>
                setActiveTab({
                  type: 'category',
                  value: 'Meetings & Appointments',
                  label: 'Meetings & Appointments'
                })
              }
              className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-teal-500 hover:shadow-sm text-left transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
                <span>Extracted Schedules</span>
                <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition">
                  <Calendar className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="font-display text-2xl font-extrabold text-slate-900">
                {stats.upcomingMeetings?.length || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {stats.upcomingMeetings?.[0]?.extractedDate || 'No upcoming dates'}
              </p>
            </button>
          </div>

          {/* Mobile Quick Filter Pills */}
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-1">
            {sidebarItems.map((item) => {
              const active = activeTab.type === item.type && activeTab.value === item.value;
              return (
                <button
                  key={item.label}
                  onClick={() => setActiveTab(item)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-emerald-400 border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {item.label} {item.count !== undefined ? `(${item.count})` : ''}
                </button>
              );
            })}
          </div>

          {/* 3-Column Master-Detail Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Desktop Segmentation Sidebar */}
            <aside className="hidden lg:block lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-3.5 space-y-5 shadow-2xs">
              <div>
                <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Reply Responsibility
                </p>
                <nav className="space-y-1">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab.type === item.type && activeTab.value === item.value;
                    return (
                      <button
                        key={item.label}
                        onClick={() => setActiveTab(item)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          active
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100/80'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : ''}`} />
                          <span>{item.label}</span>
                        </span>
                        {item.count !== undefined && (
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                              active
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Smart Segments
                </p>
                <nav className="space-y-1">
                  {[
                    { type: 'category', value: 'Action Required', label: 'Action Required', icon: SlidersHorizontal },
                    {
                      type: 'category',
                      value: 'Waiting for Response',
                      label: 'Waiting for Response',
                      icon: Clock,
                      count: stats.waitingForResponse
                    },
                    {
                      type: 'category',
                      value: 'Meetings & Appointments',
                      label: 'Meetings & Schedules',
                      icon: Calendar
                    },
                    { type: 'category', value: 'Important', label: 'Important', icon: Star },
                    { type: 'archived', value: 'true', label: 'Archived', icon: Archive }
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = activeTab.type === item.type && activeTab.value === item.value;
                    return (
                      <button
                        key={item.label}
                        onClick={() => setActiveTab(item)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          active
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100/80'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : ''}`} />
                          <span>{item.label}</span>
                        </span>
                        {item.count !== undefined && (
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                              active
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Middle Conversation Feed */}
            <section className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
              <div className="p-3.5 border-b border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-bold text-sm text-slate-900">{activeTab.label}</h2>
                    {stats.unread > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {stats.unread} unread
                      </span>
                    )}
                  </div>
                  <button
                    onClick={loadData}
                    title="Refresh Inbox"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search sender, subject, AI summary..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-400">
                    No conversations match this filter.
                  </div>
                ) : (
                  conversations.map((email, idx) => {
                    const lastMsg = email.messages[email.messages.length - 1];
                    const isSelected = email._id === selectedId;
                    const style =
                      RESPONSIBILITY_STYLES[email.responsibility] ||
                      RESPONSIBILITY_STYLES['Needs Review'];
                    const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                    return (
                      <div
                        key={email._id}
                        onClick={() => handleSelectEmail(email)}
                        className={`p-3.5 cursor-pointer transition border-l-4 ${style.border} ${
                          isSelected ? 'bg-emerald-50/50' : 'hover:bg-slate-50/90'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${avatarColor}`}
                          >
                            {getInitials(lastMsg?.senderName)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span
                                className={`text-xs truncate ${
                                  email.isUnread
                                    ? 'font-bold text-slate-900'
                                    : 'font-medium text-slate-700'
                                }`}
                              >
                                {lastMsg?.senderName}
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 shrink-0">
                                {email.provider}
                              </span>
                            </div>

                            <p
                              className={`text-xs truncate mb-1 ${
                                email.isUnread ? 'font-semibold text-slate-900' : 'text-slate-600'
                              }`}
                            >
                              {email.subject}
                            </p>

                            <p className="text-[11px] text-slate-500 line-clamp-2 mb-2.5 leading-relaxed">
                              {email.aiSummary}
                            </p>

                            <div className="flex items-center justify-between gap-1.5">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}
                              >
                                {email.responsibility}
                              </span>

                              <div className="flex items-center gap-1.5">
                                {email.extractedDate && (
                                  <span className="text-[10px] text-slate-400">📅</span>
                                )}
                                {email.isImportant && (
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Right Conversation & AI Action Panel */}
            <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs min-h-[70vh] flex flex-col justify-between">
              {!selectedEmail ? (
                <div className="m-auto text-center text-xs text-slate-400">
                  Select a conversation to view AI insights and draft replies.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Thread Header */}
                  <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-emerald-400">
                          {selectedEmail.category}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {selectedEmail.messages.length} message(s)
                        </span>
                      </div>
                      <h2 className="font-display text-base font-bold text-slate-900 leading-snug">
                        {selectedEmail.subject}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() =>
                          handleToggleFlag(
                            selectedEmail._id,
                            'isImportant',
                            selectedEmail.isImportant,
                            selectedEmail.isImportant ? 'Removed star' : 'Marked important'
                          )
                        }
                        title="Toggle Important"
                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            selectedEmail.isImportant ? 'fill-amber-400 text-amber-400' : ''
                          }`}
                        />
                      </button>
                      <button
                        onClick={() =>
                          handleToggleFlag(
                            selectedEmail._id,
                            'isUnread',
                            selectedEmail.isUnread,
                            'Updated read status'
                          )
                        }
                        title="Toggle Read/Unread"
                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
                      >
                        <MailOpen className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleToggleFlag(
                            selectedEmail._id,
                            'isArchived',
                            selectedEmail.isArchived,
                            selectedEmail.isArchived ? 'Restored to inbox' : 'Archived conversation'
                          )
                        }
                        title="Archive"
                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* AI Triage Box */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 border border-slate-700 space-y-2.5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Triage</span>
                        </span>
                        {selectedEmail.confidenceScore && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/15">
                            {Math.round(selectedEmail.confidenceScore * 100)}% confidence
                          </span>
                        )}
                      </div>

                      <select
                        value={selectedEmail.responsibility}
                        onChange={(e) => handleManualClassify(selectedEmail._id, e.target.value)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-xl border border-slate-600 bg-slate-800 text-white cursor-pointer focus:outline-none focus:border-emerald-400"
                      >
                        <option value="Assistant to Reply">Assistant to Reply</option>
                        <option value="Client to Reply">Client to Reply</option>
                        <option value="No Reply Needed">No Reply Needed</option>
                        <option value="Needs Review">Needs Review</option>
                      </select>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed">
                      {selectedEmail.aiReasoning}
                    </p>

                    {selectedEmail.clientNote && (
                      <div className="text-xs bg-amber-500/15 text-amber-200 border border-amber-400/30 px-3 py-2 rounded-xl">
                        <strong>Client Instruction:</strong> {selectedEmail.clientNote}
                      </div>
                    )}

                    {(selectedEmail.extractedAction || selectedEmail.extractedDate) && (
                      <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                        {selectedEmail.extractedAction && (
                          <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-slate-100">
                            ⚡ {selectedEmail.extractedAction}
                          </span>
                        )}
                        {selectedEmail.extractedDate && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-semibold">
                            📅 {selectedEmail.extractedDate}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Conversation History */}
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {selectedEmail.messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                          msg.role === 'external'
                            ? 'bg-white border-slate-200/90'
                            : 'bg-emerald-50/60 border-emerald-200/80'
                        }`}
                      >
                        <div className="flex items-center justify-between text-slate-500">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                              {getInitials(msg.senderName)}
                            </span>
                            <span className="font-bold text-slate-800">{msg.senderName}</span>
                          </div>
                          <span className="text-[11px]">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-slate-700 whitespace-pre-line leading-relaxed pl-8">
                          {msg.body}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Reply Composer */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Reply as {workspace.assistantName} (EA)
                      </span>
                      <button
                        onClick={handleDraftReply}
                        disabled={generatingDraft}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold text-emerald-800 transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{generatingDraft ? 'Drafting...' : 'Draft with AI'}</span>
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      placeholder="Click 'Draft with AI' or write a response..."
                      className="w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleManualClassify(selectedEmail._id, 'No Reply Needed')}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                      >
                        Mark Completed
                      </button>

                      <button
                        onClick={handleSendReply}
                        disabled={sendingReply || !replyDraft.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{sendingReply ? 'Sending...' : 'Approve & Send'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Connected Accounts Status Modal */}
      {accountsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-display font-bold text-slate-900 text-base">
                  Connected Email Accounts
                </h3>
              </div>
              <button
                onClick={() => setAccountsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Google Workspace / Gmail</p>
                  <p className="text-slate-500">{workspace.clientEmail}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Active
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Microsoft Outlook 365</p>
                  <p className="text-slate-500">arjun@nexus-board.outlook.com</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Active
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleManualSync}
                disabled={syncingAccount}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingAccount ? 'animate-spin' : ''}`} />
                <span>{syncingAccount ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Copilot Drawer & Simulate Email Modal */}
      <AICopilotDrawer isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
      <SimulateEmailModal
        isOpen={simulateOpen}
        onClose={() => setSimulateOpen(false)}
        conversations={conversations}
        onCreated={(created) => {
          showToast(`AI classified new message as "${created.responsibility}"`);
          loadData();
        }}
      />
    </div>
  );
}