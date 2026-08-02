import React, { useState, useRef, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import AIInsightCard from '../components/AIInsightCard';
import * as api from '../services/api';

const SUGGESTIONS = [
  'When should I study Physics?',
  "Why does my focus drop after 45 minutes?",
  'Build me a study plan for this week',
  'Which subject needs more attention?',
];

export default function AICoach() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    api
      .getAiInsights()
      .then((res) => {
        setEnabled(res.enabled);
        setInsight(res.insight || res.message);
      })
      .catch(() => setInsight(null))
      .finally(() => setInsightLoading(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || sending) return;

    const nextMessages = [...messages, { role: 'user', content: message }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const res = await api.aiChat(message, nextMessages);
      setEnabled(res.enabled);
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `Sorry, something went wrong: ${err.response?.data?.error || err.message}` },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="fade-in">
      <h1 className="page-title">🤖 AI Coach</h1>

      <GlassCard style={{ marginBottom: '24px' }}>
        <div className="card-header">Latest Insight</div>
        <AIInsightCard text={insight} loading={insightLoading} enabled={enabled} disabledMessage={insight} />
      </GlassCard>

      <GlassCard>
        <div className="card-header">Ask about my study patterns</div>

        {messages.length === 0 && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {SUGGESTIONS.map((s) => (
              <span key={s} className="ai-suggestion-chip" onClick={() => send(s)}>
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="ai-chat-window" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`ai-chat-bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
          {sending && (
            <div className="ai-chat-bubble assistant">
              <span className="typing-dots"><span /><span /><span /></span>
            </div>
          )}
        </div>

        <div className="ai-chat-input-row">
          <input
            type="text"
            placeholder={enabled ? 'Ask a question about your study data...' : 'AI chat is disabled — add GEMINI_API_KEY'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!enabled}
          />
          <button className="btn-primary" onClick={() => send()} disabled={!enabled || sending || !input.trim()}>
            Send
          </button>
        </div>
      </GlassCard>
    </div>
  );
}