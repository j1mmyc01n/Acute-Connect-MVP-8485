import React, { useState, useEffect, useRef } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiMessageCircle, FiX, FiSend, FiZap, FiTrash2 } = FiIcons;

const INITIAL_MSG = { role: 'assistant', content: 'Hi! I\'m Jax, your AI assistant. I monitor the platform 24/7. How can I assist you today?' };

export default function JaxAI({ role }) {
  // Only render for logged-in staff members
  if (!role || (role !== 'admin' && role !== 'sysadmin')) return null;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MSG]);
  const [input, setInput] = useState('');
  const [hasTasks, setHasTasks] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      setHasTasks(hour >= 9 && hour <= 17);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const clearChat = () => {
    setMessages([INITIAL_MSG]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const aiConfig = JSON.parse(localStorage.getItem('ac_int_ai') || '{}');

    // Make real API call if configured
    if (aiConfig.api_key && aiConfig.status === 'connected') {
      try {
        const systemPrompt = {
          role: 'system',
          content: `You are Jax, an AI assistant for the Acute Care Services platform. You help Admins and SysAdmins manage patients, crises, and system metrics. Features include: Triage Dashboard, Client CRM, Heat Map & Dispatch, and Clinical Reports. Be concise, professional, and helpful.`
        };
        
        // Prevent huge payloads by only sending the last 10 messages
        const recentMessages = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));

        const response = await fetch(aiConfig.endpoint || 'https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.api_key}`
          },
          body: JSON.stringify({
            model: aiConfig.model || 'gpt-3.5-turbo',
            messages: [systemPrompt, ...recentMessages, userMsg],
            max_tokens: 500
          })
        });
        
        const data = await response.json();
        setIsTyping(false);

        if (data.choices && data.choices[0]) {
          setMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Invalid API response. Please check your token in Integrations.' }]);
        }
      } catch (err) {
        setIsTyping(false);
        setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Could not reach the AI provider.' }]);
      }
    } else {
      // Fallback simulated response if no API key is provided
      setTimeout(() => {
        setIsTyping(false);
        const lowerQuery = userMsg.content.toLowerCase();
        let reply = 'I am currently in demo mode. Please configure your OpenAI API key in the Integrations Settings to enable my full capabilities.';
        
        if (lowerQuery.includes('patient') || lowerQuery.includes('client')) {
          reply = 'You have 142 active patients. 12 require follow-up. Connect my API key to get deeper insights!';
        } else if (lowerQuery.includes('crisis') || lowerQuery.includes('emergency')) {
          reply = 'Crisis management system is active. Current alert level: Low. Connect my API key for full predictive analytics.';
        }
        
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      }, 1000);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          boxShadow: hasTasks 
            ? '0 0 0 0 rgba(102, 126, 234, 0.7), 0 8px 24px rgba(102, 126, 234, 0.4)' 
            : '0 8px 24px rgba(102, 126, 234, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 28,
          transition: 'all 0.3s ease',
          animation: hasTasks ? 'jax-pulse 2s infinite' : 'none',
          zIndex: 999
        }}
        title="Chat with Jax AI"
      >
        <SafeIcon icon={FiMessageCircle} size={28} />
        {hasTasks && (
          <div style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#ff4757',
            border: '3px solid var(--ac-surface)',
            animation: 'jax-bounce 1s infinite'
          }} />
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 100,
          right: 24,
          width: 380,
          height: 550,
          background: 'var(--ac-surface)',
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          overflow: 'hidden',
          border: '1px solid var(--ac-border)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <SafeIcon icon={FiZap} size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Jax AI</div>
                <div style={{ fontSize: 11, opacity: 0.9 }}>Always monitoring • Online</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={clearChat}
                title="Clear Chat History"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#fff',
                  transition: 'background 0.2s'
                }}
              >
                <SafeIcon icon={FiTrash2} size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#fff',
                  transition: 'background 0.2s'
                }}
              >
                <SafeIcon icon={FiX} size={18} />
              </button>
            </div>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : 'var(--ac-bg)',
                  color: msg.role === 'user' ? '#fff' : 'var(--ac-text)',
                  fontSize: 14,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '16px 16px 16px 4px',
                  background: 'var(--ac-bg)',
                  color: 'var(--ac-muted)',
                  fontSize: 14,
                  display: 'flex',
                  gap: 4
                }}>
                  <span className="dot-pulse">.</span><span className="dot-pulse" style={{ animationDelay: '0.2s' }}>.</span><span className="dot-pulse" style={{ animationDelay: '0.4s' }}>.</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{
            padding: 16,
            borderTop: '1px solid var(--ac-border)',
            display: 'flex',
            gap: 8
          }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask Jax anything..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid var(--ac-border)',
                background: 'var(--ac-bg)',
                color: 'var(--ac-text)',
                fontSize: 14,
                outline: 'none'
              }}
            />
            <button
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s',
                opacity: isTyping || !input.trim() ? 0.6 : 1
              }}
            >
              <SafeIcon icon={FiSend} size={18} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes jax-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7), 0 8px 24px rgba(102, 126, 234, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(102, 126, 234, 0), 0 8px 24px rgba(102, 126, 234, 0.4); }
        }
        @keyframes jax-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .dot-pulse {
          animation: pulse-dot 1s infinite;
        }
      `}</style>
    </>
  );
}