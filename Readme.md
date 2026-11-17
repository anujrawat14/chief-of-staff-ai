# ChiefOfStaff.ai — AI-Powered Personal Assistant Email Management Dashboard

An executive email triage and delegation workspace built for **Personal / Executive Assistants (EAs)** and their **Executive Principals**. Powered by **Google Gemini**, **ChiefOfStaff.ai** classifies incoming email threads by reply ownership, extracts action items and meeting dates, drafts context-aware replies with mandatory human approval, and provides a distraction-free **Client View** for the executive.

- **Live Application (Vercel):** [https://chief-of-staff-ai-lac.vercel.app](https://chief-of-staff-ai-lac.vercel.app)
- **Backend API (Render):** `https://chief-of-staff-ai-backend-noqp.onrender.com`


---

## Core Features

- **Workspace Onboarding & Account Sync:** Guided 2-step onboarding with simulated Gmail & Outlook OAuth authorization flows, permission scope previews, and real-time sync status management.
- **AI Reply-Ownership Triage:** Every incoming thread is automatically analyzed by Gemini and routed into one of four responsibility buckets with confidence scores and transparent reasoning:
  - `Assistant to Reply` — Routine scheduling, vendor follow-ups, and operational logistics.
  - `Client to Reply` — High-stakes approvals, VIP invitations, and personal executive decisions.
  - `Needs Review` — Ambiguous threads flagged when AI confidence is below threshold (`< 75%`).
  - `No Reply Needed` — Newsletters, receipts, and informational updates.
- **Smart Segmentation & Search:** Instant filtering by responsibility, workflow category (`Action Required`, `Waiting for Response`, `Meetings & Appointments`, `Important`, `Archived`), and full-text search across senders, subjects, and AI summaries.
- **Human-in-the-Loop AI Reply Composer:** One-click context-aware reply drafting tailored to the Executive Assistant persona—editable before clicking **Approve & Send** (zero unapproved auto-sending).
- **Minimalistic Client-Facing View:** A dedicated executive feed showing *only* threads requiring the client's personal attention, complete with AI summaries, rationale for why their input is needed, one-click **Mark Handled**, and **Delegate to Assistant** (with custom instruction notes).
- **Live Incoming Email Simulator:** Inject new emails or replies to existing threads using one-click presets or custom text to test real-time Gemini classification and thread re-evaluation.
- **Conversational Inbox AI Copilot:** Natural-language drawer to query deadlines, pending follow-ups, and priority threads across the live inbox.

---

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS v4, Axios, Lucide React
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB Atlas
- **AI Engine:** Google Gemini API (`@google/genai`)
- **Deployment:** Vercel (Frontend) & Render (Backend)

---

## Project Structure

```text
├── backend/
│   └── pa-email-backend/
│       ├── models/          # Mongoose Conversation & Message schemas
│       ├── routes/          # Email triage, simulation, reply & AI chat endpoints
│       ├── services/        # Modular Gemini AI classification & drafting service
│       ├── seed.js          # Representative multi-thread executive inbox seeder
│       └── server.js        # Express entry point
└── frontend/
    └── src/
        ├── components/
        │   ├── Onboarding.jsx       # Workspace setup & simulated OAuth flow
        │   ├── ClientView.jsx       # Distraction-free executive feed & delegation
        │   └── AICopilotModal.jsx   # Conversational AI drawer & email simulator
        ├── api.js                   # Centralized Axios API client
        ├── App.jsx                  # Assistant workspace, KPI cards & role switcher
        └── index.css                # Tailwind v4 configuration & custom styling
