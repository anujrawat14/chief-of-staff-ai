import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Conversation from './models/conversation';

dotenv.config();

const sampleConversations = [
  {
    subject: 'Series A Term Sheet – Final Sign-Off Required',
    provider: 'Gmail',
    responsibility: 'Client to Reply',
    confidenceScore: 0.97,
    aiReasoning: 'Involves legal equity terms and board seat approval that only the founder can authorize.',
    aiSummary: 'Lead investor Priya Nair shared the final redlined Series A term sheet and requested Arjun’s personal sign-off before Friday’s board call.',
    extractedAction: 'Review & approve clause 4.2 on board observer rights',
    extractedDate: 'Nov 20, 2026 at 5:00 PM',
    category: 'Important',
    isUnread: true,
    isImportant: true,
    messages: [
      {
        senderName: 'Priya Nair (Peak XV Partners)',
        senderEmail: 'priya@peakxv.example.com',
        body: 'Hi Arjun, our legal team has incorporated your feedback on the liquidation preference. Please confirm personally if you are comfortable with Section 4.2 so we can circulate execution copies by Friday 5 PM.',
        role: 'external',
        timestamp: new Date(Date.now() - 1000 * 60 * 45)
      }
    ]
  },
  {
    subject: 'Rescheduling Thursday Podcast Recording',
    provider: 'Gmail',
    responsibility: 'Assistant to Reply',
    confidenceScore: 0.95,
    aiReasoning: 'Routine calendar coordination and studio slot rescheduling best handled by the assistant.',
    aiSummary: 'Rohan from TechFounders Podcast asked to move Thursday’s 2 PM recording to Friday morning due to a studio conflict.',
    extractedAction: 'Confirm Friday 10:30 AM slot on Arjun’s calendar',
    extractedDate: 'Nov 19, 2026 at 2:00 PM',
    category: 'Meetings & Appointments',
    isUnread: true,
    isImportant: false,
    messages: [
      {
        senderName: 'Rohan Verma',
        senderEmail: 'rohan@techfounders.fm',
        body: 'Hey team, our Mumbai studio had a power maintenance notice for Thursday afternoon. Can we shift Arjun’s recording to Friday at 10:30 AM or 11:30 AM? Let me know what works on his calendar.',
        role: 'external',
        timestamp: new Date(Date.now() - 1000 * 60 * 120)
      }
    ]
  },
  {
    subject: 'AWS Activate Credits & Invoice #INV-8841',
    provider: 'Outlook',
    responsibility: 'Assistant to Reply',
    confidenceScore: 0.92,
    aiReasoning: 'Administrative billing inquiry requiring tax GST certificate upload.',
    aiSummary: 'AWS billing support requested updated GST registration details to apply promotional credits to October’s invoice.',
    extractedAction: 'Reply with company GST certificate PDF',
    extractedDate: 'Nov 18, 2026',
    category: 'Action Required',
    isUnread: false,
    isImportant: false,
    messages: [
      {
        senderName: 'AWS Billing Support',
        senderEmail: 'billing-support@amazon.example.com',
        body: 'Hello, to finalize your $10,000 promotional credit application on Account #449102, please reply to this thread with your updated GST certificate.',
        role: 'external',
        timestamp: new Date(Date.now() - 1000 * 60 * 300)
      }
    ]
  },
  {
    subject: 'Speaking Invitation: Bengaluru AI Summit Keynote',
    provider: 'Gmail',
    responsibility: 'Client to Reply',
    confidenceScore: 0.91,
    aiReasoning: 'Keynote topic selection and personal willingness to attend require the client’s direct input.',
    aiSummary: 'Summit organizers invited Arjun to deliver a 20-minute keynote on December 12 and asked which topic he prefers.',
    extractedAction: 'Decide between "AI Agents in Enterprise" or "Bootstrapping to Scale"',
    extractedDate: 'Dec 12, 2026 at 11:00 AM',
    category: 'Meetings & Appointments',
    isUnread: true,
    isImportant: true,
    messages: [
      {
        senderName: 'Meera Krishnan',
        senderEmail: 'meera@aisummit.in',
        body: 'Dear Arjun, we would love to host you as our opening keynote speaker on Dec 12. Would you prefer speaking on autonomous AI workflows or SaaS unit economics? Once you confirm, we can coordinate travel with your assistant.',
        role: 'external',
        timestamp: new Date(Date.now() - 1000 * 60 * 500)
      }
    ]
  },
  {
    subject: 'Quick check-in on the Q4 partnership idea',
    provider: 'Outlook',
    responsibility: 'Needs Review',
    confidenceScore: 0.62,
    aiReasoning: 'Low confidence (62%): Message is vague ("let’s circle back soon")—unclear if client wants a meeting scheduled or will reply personally.',
    aiSummary: 'Vikram sent a brief follow-up asking to reconnect on a prior Q4 partnership discussion without specifying next steps.',
    extractedAction: 'Clarify with client or schedule exploratory call',
    extractedDate: '',
    category: 'Action Required',
    isUnread: true,
    isImportant: false,
    messages: [
      {
        senderName: 'Vikram Desai',
        senderEmail: 'vikram@cloudscale.io',
        body: 'Hey Arjun, hope Delhi treated you well! Just bumping this up—let’s figure out how we want to play Q4 together.',
        role: 'external',
        timestamp: new Date(Date.now() - 1000 * 60 * 600)
      }
    ]
  },
  {
    subject: 'Flight Itinerary Confirmed: DEL → BLR (6E-214)',
    provider: 'Gmail',
    responsibility: 'No Reply Needed',
    confidenceScore: 0.99,
    aiReasoning: 'Automated airline booking confirmation; no response required.',
    aiSummary: 'IndiGo confirmed Arjun’s flight from New Delhi to Bengaluru for Nov 22 at 08:15 AM (PNR: K9X4LP).',
    extractedAction: '',
    extractedDate: 'Nov 22, 2026 at 08:15 AM',
    category: 'General',
    isUnread: false,
    isImportant: false,
    messages: [
      {
        senderName: 'IndiGo Airlines',
        senderEmail: 'reservations@goindigo.example.in',
        body: 'Your booking is confirmed. Flight 6E-214 departs Terminal 3, New Delhi on Nov 22 at 08:15 AM. Seat 2A (Window) assigned.',
        role: 'external',
        timestamp: new Date(Date.now() - 1000 * 60 * 900)
      }
    ]
  },
  {
    subject: 'Updated Office Lease Agreement – Koramangala Hub',
    provider: 'Outlook',
    responsibility: 'No Reply Needed',
    confidenceScore: 0.94,
    aiReasoning: 'Assistant already replied with requested documents; currently waiting for landlord’s counter-signature.',
    aiSummary: 'Landlord sent draft lease; Anuj replied yesterday with KYC docs and is awaiting final countersigned copy.',
    extractedAction: 'Follow up if counter-signed copy not received by Nov 20',
    extractedDate: '',
    category: 'Waiting for Response',
    isUnread: false,
    isImportant: false,
    messages: [
      {
        senderName: 'Suresh Menon (Commercial Estates)',
        senderEmail: 'suresh@blrproperties.in',
        body: 'Please share the authorized signatory ID so we can stamp the lease agreement.',
        role: 'external',
        timestamp: new Date(Date.now() - 1000 * 60 * 1500)
      },
      {
        senderName: 'Anuj (EA to Arjun)',
        senderEmail: 'anuj.ea@nexusventures.in',
        body: 'Hi Suresh, attached the signatory documents and board resolution. Please share the countersigned PDF once stamped.',
        role: 'assistant',
        timestamp: new Date(Date.now() - 1000 * 60 * 1400)
      }
    ]
  }
];

async function seedDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Conversation.deleteMany({});
  await Conversation.insertMany(sampleConversations);
  console.log('Seeded 7 realistic email conversations successfully!');
  process.exit(0);
}

seedDB();