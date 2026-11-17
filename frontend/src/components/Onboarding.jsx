import React, { useState } from 'react';
import {
  Mail,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  UserCheck,
  Lock,
  Layers
} from 'lucide-react';

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [assistantName, setAssistantName] = useState('Anuj');
  const [clientName, setClientName] = useState('Arjun Mehta');
  const [clientEmail, setClientEmail] = useState('arjun.mehta@nexusventures.in');

  const [connections, setConnections] = useState({
    Gmail: { connected: false, syncing: false, email: 'arjun.mehta@nexusventures.in' },
    Outlook: { connected: false, syncing: false, email: 'arjun@nexus-board.outlook.com' }
  });

  const [oauthModal, setOauthModal] = useState(null);

  const handleAuthorize = (provider) => {
    setOauthModal(null);
    setConnections((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], syncing: true }
    }));

    setTimeout(() => {
      setConnections((prev) => ({
        ...prev,
        [provider]: { ...prev[provider], syncing: false, connected: true }
      }));
    }, 1200);
  };

  const anyConnected = connections.Gmail.connected || connections.Outlook.connected;

  return (
    <div className="min-h-screen bg-[#090d16] relative overflow-hidden flex items-center justify-center p-4">
      {/* Subtle Ambient Emerald Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden grid md:grid-cols-5 relative z-10">
        {/* Left Deep Slate Executive Panel */}
        <div className="md:col-span-2 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/60 border-b md:border-b-0 md:border-r border-slate-800 p-8 flex flex-col justify-between text-white">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>ChiefOfStaff.ai</span>
            </div>

            <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-white mb-3">
              Executive inbox triage, automated.
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Separate operational logistics from founder-level decisions in seconds—giving your client a distraction-free workspace.
            </p>
          </div>

          <div className="space-y-3.5 text-xs text-slate-300 mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-start gap-2.5">
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>AI classifies Assistant vs. Client reply ownership automatically</span>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Mandatory human approval before any email is dispatched</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Layers className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Real-time sync between Assistant & Client dashboards</span>
            </div>
          </div>
        </div>

        {/* Right Crisp White Setup Surface */}
        <div className="md:col-span-3 bg-white p-8 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Step Indicator */}
            <div className="flex items-center gap-3 text-xs font-semibold mb-7">
              <span
                className={`px-2.5 py-1 rounded-full ${
                  step === 1
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                01. Workspace
              </span>
              <span className="text-slate-300">—</span>
              <span
                className={`px-2.5 py-1 rounded-full ${
                  step === 2
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                02. Inbox Sync
              </span>
            </div>

            {step === 1 ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep(2);
                }}
                className="space-y-4"
              >
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900">
                    Configure Executive Pair
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Define the Personal Assistant and the Executive Principal you manage.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Personal Assistant Name
                  </label>
                  <input
                    type="text"
                    required
                    value={assistantName}
                    onChange={(e) => setAssistantName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Executive / Client Name
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Primary Executive Email
                  </label>
                  <input
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-3 bg-slate-900 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                >
                  <span>Continue to Inbox Connections</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900">
                    Connect Client Accounts
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Authorize OAuth read & draft scopes to enable live Gemini AI classification.
                  </p>
                </div>

                {['Gmail', 'Outlook'].map((provider) => {
                  const state = connections[provider];
                  return (
                    <div
                      key={provider}
                      className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                        state.connected
                          ? 'border-emerald-300 bg-emerald-50/60'
                          : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm shadow-2xs ${
                            provider === 'Gmail'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-sky-100 text-sky-700'
                          }`}
                        >
                          {provider === 'Gmail' ? 'G' : 'O'}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                            <span>
                              {provider === 'Gmail'
                                ? 'Google Workspace / Gmail'
                                : 'Microsoft Outlook 365'}
                            </span>
                            {state.connected && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> Synced
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            {provider === 'Gmail' ? clientEmail : state.email}
                          </p>
                        </div>
                      </div>

                      {state.connected ? (
                        <span className="text-xs font-bold text-emerald-700">Connected</span>
                      ) : state.syncing ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing...
                        </span>
                      ) : (
                        <button
                          onClick={() => setOauthModal(provider)}
                          className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-emerald-600 hover:text-emerald-700 text-xs font-semibold text-slate-800 shadow-2xs transition cursor-pointer"
                        >
                          Authorize
                        </button>
                      )}
                    </div>
                  );
                })}

                <div className="pt-4 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    ← Back
                  </button>

                  <button
                    onClick={() =>
                      onComplete({
                        assistantName,
                        clientName,
                        clientEmail,
                        connections
                      })
                    }
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition cursor-pointer ${
                      anyConnected
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>{anyConnected ? 'Launch Workspace' : 'Enter Demo Workspace'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 mt-7 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Simulated OAuth 2.0 flow paired with live Gemini AI & MongoDB threads.</span>
          </p>
        </div>
      </div>

      {/* Simulated OAuth Modal */}
      {oauthModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 text-base">
                  Authorize {oauthModal} Access
                </h3>
                <p className="text-xs text-slate-500">
                  {oauthModal === 'Gmail' ? clientEmail : connections.Outlook.email}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-600 space-y-2 mb-5 border border-slate-200">
              <p className="font-bold text-slate-800">Granted Permissions:</p>
              <p>• Read incoming and sent threads for AI reply-ownership triage</p>
              <p>• Generate editable drafts (never auto-dispatched without approval)</p>
              <p>• Extract meeting schedules and action items</p>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setOauthModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAuthorize(oauthModal)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
              >
                Allow & Sync Inbox
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}