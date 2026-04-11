import { useState, useEffect, useRef } from 'react'
import { chatbotAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Send, Bot, User, Loader2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const WELCOME = {
  id: 'welcome',
  role: 'bot',
  text: "👋 Hi! I'm your Smart Campus AI Assistant. I can help you with attendance, assignments, notices, campus info, and more!\n\nTry asking me something below 👇",
  time: new Date(),
}

export default function Chatbot() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const bottomRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    fetchSuggestions()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchSuggestions = async () => {
    try {
      const { data } = await chatbotAPI.getSuggestions()
      setSuggestions(data.suggestions)
    } catch {}
  }

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    const userMsg = { id: Date.now(), role: 'user', text: msg, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const { data } = await chatbotAPI.sendMessage(msg)
      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        text: data.reply,
        data: data.data,
        intent: data.intent,
        time: new Date(),
      }
      setMessages(prev => [...prev, botMsg])
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        text: '❌ Sorry, I encountered an error. Please try again.',
        time: new Date(),
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const clearChat = () => {
    setMessages([WELCOME])
    fetchSuggestions()
  }

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease', maxWidth: 760, margin: '0 auto', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
          }}>🤖</div>
          <div>
            <h1 className="page-title" style={{ fontSize: 20 }}>Campus AI Assistant</h1>
            <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block' }} />
              Always online · Powered by Smart Campus
            </p>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={clearChat}>
          <RefreshCw size={14} /> Clear chat
        </button>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12,
        padding: '4px 4px', marginBottom: 16,
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            gap: 10, alignItems: 'flex-end',
            animation: 'fadeInUp 0.3s ease',
          }}>
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'linear-gradient(135deg, #0f172a, #1e293b)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: msg.role === 'bot' ? 16 : 13,
              color: 'white', fontWeight: 700,
            }}>
              {msg.role === 'bot' ? '🤖' : user?.name?.charAt(0).toUpperCase()}
            </div>

            {/* Bubble */}
            <div style={{ maxWidth: '75%' }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'var(--bg-card)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                wordBreak: 'break-word',
              }}>
                {msg.text}
              </div>

              {/* Extra data card */}
              {msg.data?.type === 'attendance' && (
                <div style={{
                  marginTop: 8, padding: '12px 14px', borderRadius: 12,
                  background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                  fontSize: 13,
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#a5b4fc' }}>📊 Quick Summary</div>
                  {Object.entries(msg.data.summary || {}).slice(0, 4).map(([subj, s]) => (
                    <div key={subj} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: 'var(--text-secondary)' }}>
                      <span>{subj}</span>
                      <span style={{ color: s.percentage >= 75 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                        {s.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4,
                textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {msg.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>🤖</div>
            <div style={{
              padding: '14px 18px', borderRadius: '4px 16px 16px 16px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              display: 'flex', gap: 5, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)',
                  animation: `pulse-glow 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && messages.length <= 1 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>💡 Try asking:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {suggestions.map(s => (
              <button key={s} className="chip" onClick={() => sendMessage(s)} style={{ fontSize: 12 }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div style={{
        display: 'flex', gap: 10,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '8px 8px 8px 16px',
        transition: 'border-color 0.2s',
      }}>
        <textarea
          ref={inputRef}
          rows={1}
          placeholder="Ask me anything about campus..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontSize: 14, resize: 'none',
            fontFamily: 'var(--font-body)', lineHeight: 1.5,
            paddingTop: 6,
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="btn btn-primary btn-icon"
          style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, alignSelf: 'flex-end' }}
        >
          <Send size={16} />
        </button>
      </div>
      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
        AI responses are based on your campus data. Always verify critical information.
      </p>
    </div>
  )
}
