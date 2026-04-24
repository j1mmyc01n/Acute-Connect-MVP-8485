import React, { useState, useEffect, useRef } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiMessageCircle, FiX, FiSend, FiZap, FiTrash2, FiMinus } = FiIcons;

const SYSTEM_PROMPT = `You are Jax, the AI assistant built into the Acute Care Services platform — a mental health and crisis management system operating in Camperdown, NSW, Australia.

PLATFORM KNOWLEDGE:
- Client Check-In: Clients use their CRN to check in and schedule call-back windows (morning/afternoon/evening)
- CRN System: Clinical Reference Numbers are auto-generated unique IDs for each patient
- CRN Request Tab: Clients can self-register by providing first name, mobile, and email — a CRN is auto-issued and pushed back to them
- Client CRM: Admins manage all patient records, care centre assignments, support categories, and offboarding
- Care Centres: Dynamically fetched from the database — Main Campus, North Clinic, Camperdown Medical etc.
- Triage Dashboard: Clinicians see pending check-ins, mood scores, and AI-prioritised patient queues
- Crisis Management: Admins can raise crisis events, request police/ambulance, assign team members, and resolve events
- Crisis Analytics: SysAdmin view of crisis event distribution over time and hotspots
- Heat Map & Dispatch: City-level AI predictive dispatch with OpenStreetMap integration
- Clinical Reports: Check-in data with mood scores, editable clinical notes, CSV export
- Invoicing & Billing: Client billing management
- Integrations: Google Workspace, Outlook 365, Calendly, and OpenAI GPT-4 can be configured in Admin > Integrations
- Staff Management: SysAdmin can add/edit staff with roles (admin, sysadmin)
- Care Centres Management: SysAdmin can create and manage care centres with CRN suffixes
- Module Access: Role-based permission overview
- Settings: Global config (site name, email, phone) — SysAdmin only
- System Dashboard: Live connectivity, provider metrics, traffic overview
- Feedback & Tickets: User-submitted support tickets with priority levels
- Feature Requests: Community-voted feature roadmap
- Provider Metrics: Performance stats for healthcare providers
- Bulk Offboarding: Admin tool to offboard multiple clients at once
- Jax AI: That's you — accessible only to admin and sysadmin users

ROLES:
- Public: Can use Check-In, Get CRN, view Professionals and Resources
- Admin: Full patient/crisis/CRM/invoicing/integration management
- SysAdmin: Everything + system config, staff, care centres, settings, super admin

Be concise, professional, and helpful. When asked how to do something on the platform, give clear step-by-step instructions. You can answer questions about the system, patients, workflows, and best practices.`;

const INITIAL_MSG = {
  role: 'assistant',
  content: "Hi! I'm **Jax**, your AI platform assistant. I monitor Acute Care 24/7 and can help you navigate the system, manage patients, handle crises, and more.\n\nWhat can I help you with today?"
};

const MAX_HISTORY = 12;

export default function JaxAI({ role }) {
  if (!role || (role !== 'admin' && role !== 'sysadmin')) return null;

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MSG]);
  const [input, setInput] = useState('');
  const [hasTasks, setHasTasks] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const hour = new Date().getHours();
    setHasTasks(hour >= 8 && hour <= 20);
    const interval = setInterval(() => {
      const h = new Date().getHours();
      setHasTasks(h >= 8 && h <= 20);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const clearChat = () => setMessages([INITIAL_MSG]);

  const formatMsg = (text) => {
    // Bold markdown
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    const aiConfig = JSON.parse(localStorage.getItem('ac_int_ai') || '{}');

    if (aiConfig.api_key && aiConfig.status === 'connected') {
      try {
        // Cap history to prevent large payloads
        const historySlice = newMessages.slice(-MAX_HISTORY).map(m => ({ role: m.role, content: m.content }));

        const response = await fetch(aiConfig.endpoint || 'https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.api_key}`
          },
          body: JSON.stringify({
            model: aiConfig.model || 'gpt-3.5-turbo',
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...historySlice],
            max_tokens: 600,
            temperature: 0.7
          })
        });

        const data = await response.json();
        setIsTyping(false);

        if (data.choices?.[0]?.message?.content) {
          setMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
        } else if (data.error) {
          setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ API Error: ${data.error.message}` }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Unexpected response. Check your API key in Integrations.' }]);
        }
      } catch (err) {
        setIsTyping(false);
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Could not connect to AI provider. Check your network or API config in Integrations.' }]);
      }
    } else {
      // Smart fallback responses
      setTimeout(() => {
        setIsTyping(false);
        const q = userMsg.content.toLowerCase();
        let reply = '🔑 I\'m in demo mode. To unlock full AI capabilities, go to **Admin → Integrations → AI Engine** and enter your OpenAI API key.';

        if (q.includes('crn') || q.includes('clinical reference')) {
          reply = 'To get a CRN:\n\n**For clients:** Use the "Get CRN" tab on the Check-In page — enter your name, mobile, and email.\n\n**For staff:** Go to **CRM → Register Patient** or use the Patient Registry module.';
        } else if (q.includes('care centre') || q.includes('assign')) {
          reply = 'To assign a care centre:\n\n1. Go to **Client CRM**\n2. Click the ✏️ edit button on a patient\n3. Select a care centre from the dropdown\n4. Save changes\n\nTo add new care centres, SysAdmin can go to **Care Centres** in the SYSADMIN menu.';
        } else if (q.includes('crisis')) {
          reply = 'To raise a crisis event:\n\n1. Go to **Crisis Management** in the ADMIN menu\n2. Click **Raise Event**\n3. Fill in client details, location, and severity\n4. Use the dispatch buttons to request Police or Ambulance';
        } else if (q.includes('patient') || q.includes('client') || q.includes('register')) {
          reply = 'To register a new patient:\n\n1. Go to **Client CRM** → click **Register Patient**\n2. Or use the **Patient Registry** module\n3. Fill in name, email, phone, category, and care centre\n4. A CRN is auto-generated and saved';
        } else if (q.includes('report') || q.includes('export')) {
          reply = 'Clinical reports are in the **Clinical Reports** section (ADMIN menu).\n\nYou can:\n- View all check-ins with mood scores\n- Add/edit clinical notes per check-in\n- Export all data as **CSV**';
        } else if (q.includes('integrat') || q.includes('api') || q.includes('openai')) {
          reply = 'To configure integrations:\n\n1. Go to **Admin → Integrations**\n2. Click **Configure AI Engine**\n3. Enter your OpenAI API key, select model (GPT-4 recommended)\n4. Save — I\'ll be fully operational!';
        } else if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
          reply = `Hello, ${role}! I'm Jax. I know this platform inside and out. Ask me anything — how to register patients, manage crises, configure integrations, or run reports.`;
        }

        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      }, 800);
    }
  };

  const quickPrompts = [
    'How do I assign a care centre?',
    'How do I raise a crisis event?',
    'How do I configure AI?',
    'How do I export reports?'
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => { setIsOpen(true); setIsMinimized(false); }}
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 60, height: 60, borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none', cursor: 'pointer',
          display: isOpen && !isMinimized ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 26,
          boxShadow: hasTasks
            ? '0 0 0 0 rgba(102,126,234,0.7), 0 8px 24px rgba(102,126,234,0.4)'
            : '0 8px 24px rgba(102,126,234,0.4)',
          animation: hasTasks ? 'jax-pulse 2s infinite' : 'none',
          transition: 'transform 0.2s', zIndex: 999
        }}
        title="Chat with Jax AI"
      >
        <SafeIcon icon={FiMessageCircle} size={26} />
        {hasTasks && (
          <div style={{ position: 'absolute', top: -3, right: -3, width: 16, height: 16, borderRadius: '50%', background: '#ff4757', border: '2px solid #fff', animation: 'jax-bounce 1.5s infinite' }} />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          width: Math.min(400, window.innerWidth - 32),
          height: isMinimized ? 'auto' : 540,
          background: 'var(--ac-surface)',
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          display: 'flex', flexDirection: 'column',
          zIndex: 1000, overflow: 'hidden',
          border: '1px solid var(--ac-border)',
          transition: 'height 0.3s ease'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '14px 18px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', color: '#fff', flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SafeIcon icon={FiZap} size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>Jax AI</div>
                <div style={{ fontSize: 10, opacity: 0.85 }}>
                  {hasTasks ? '🟢 Monitoring active tasks' : '🔵 Platform online'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={clearChat} title="Clear chat" style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <SafeIcon icon={FiTrash2} size={13} />
              </button>
              <button onClick={() => setIsMinimized(!isMinimized)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <SafeIcon icon={FiMinus} size={13} />
              </button>
              <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <SafeIcon icon={FiX} size={15} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '88%', padding: '9px 13px',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.role === 'user' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'var(--ac-bg)',
                      color: msg.role === 'user' ? '#fff' : 'var(--ac-text)',
                      fontSize: 13, lineHeight: 1.55,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                    }}
                      dangerouslySetInnerHTML={{ __html: formatMsg(msg.content) }}
                    />
                  </div>
                ))}

                {isTyping && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ padding: '9px 13px', borderRadius: '16px 16px 16px 4px', background: 'var(--ac-bg)', display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0, 0.2, 0.4].map((d, i) => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ac-muted)', animation: `jax-dot 1s ${d}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompts */}
              {messages.length <= 1 && (
                <div style={{ padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {quickPrompts.map((p, i) => (
                    <button key={i} onClick={() => { setInput(p); inputRef.current?.focus(); }} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 20, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div style={{ padding: '10px 12px 14px', borderTop: '1px solid var(--ac-border)', display: 'flex', gap: 8, flexShrink: 0 }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask Jax anything..."
                  style={{ flex: 1, padding: '9px 13px', borderRadius: 12, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                />
                <button
                  onClick={handleSend}
                  disabled={isTyping || !input.trim()}
                  style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', color: '#fff', cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isTyping || !input.trim() ? 0.5 : 1, transition: 'opacity 0.2s', flexShrink: 0 }}
                >
                  <SafeIcon icon={FiSend} size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes jax-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(102,126,234,0.7), 0 8px 24px rgba(102,126,234,0.4); }
          50% { box-shadow: 0 0 0 14px rgba(102,126,234,0), 0 8px 24px rgba(102,126,234,0.4); }
        }
        @keyframes jax-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes jax-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}