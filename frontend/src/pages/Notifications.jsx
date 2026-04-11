import { useNotifications } from '../contexts/NotificationContext'
import { Bell, CheckCheck, Trash2, BookOpen, ClipboardList, CalendarCheck } from 'lucide-react'
import { notificationAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const TYPE_CONFIG = {
  assignment: { icon: <BookOpen size={16} />, color: '#a5b4fc', bg: 'rgba(99,102,241,0.15)' },
  notice: { icon: <ClipboardList size={16} />, color: '#67e8f9', bg: 'rgba(6,182,212,0.15)' },
  attendance: { icon: <CalendarCheck size={16} />, color: '#6ee7b7', bg: 'rgba(16,185,129,0.15)' },
  announcement: { icon: '📢', color: '#fcd34d', bg: 'rgba(245,158,11,0.15)' },
  system: { icon: '⚙️', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
}

export default function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead, fetchNotifications } = useNotifications() || {}
  const navigate = useNavigate()

  const handleClick = async (n) => {
    if (!n.isRead) await markRead(n._id)
    if (n.link) navigate(n.link)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    try {
      await notificationAPI.delete(id)
      await fetchNotifications()
    } catch { toast.error('Failed to delete') }
  }

  const groupByDate = (notifs) => {
    const groups = {}
    notifs?.forEach(n => {
      const d = new Date(n.createdAt)
      const today = new Date()
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
      let key
      if (d.toDateString() === today.toDateString()) key = 'Today'
      else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday'
      else key = d.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })
      if (!groups[key]) groups[key] = []
      groups[key].push(n)
    })
    return groups
  }

  const groups = groupByDate(notifications)

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease', maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={markAllRead}>
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {notifications?.length > 0 ? (
        Object.entries(groups).map(([date, notifs]) => (
          <div key={date} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              {date}
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {notifs.map(n => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system
                return (
                  <div key={n._id}
                    onClick={() => handleClick(n)}
                    style={{
                      display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 12,
                      background: n.isRead ? 'var(--bg-card)' : 'rgba(99,102,241,0.06)',
                      border: `1px solid ${n.isRead ? 'var(--border)' : 'rgba(99,102,241,0.2)'}`,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: cfg.color,
                    }}>
                      {typeof cfg.icon === 'string' ? <span style={{ fontSize: 18 }}>{cfg.icon}</span> : cfg.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: n.isRead ? 500 : 700, fontSize: 14 }}>{n.title}</span>
                        {!n.isRead && <div className="notif-dot" style={{ flexShrink: 0, marginTop: 4 }} />}
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 6 }}>
                        {n.message}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                        {n.sender && <span>From: {n.sender.name}</span>}
                        <span>·</span>
                        <span>{new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className={`badge ${
                          n.type === 'assignment' ? 'badge-purple' :
                          n.type === 'notice' ? 'badge-cyan' :
                          n.type === 'attendance' ? 'badge-green' : 'badge-gray'
                        }`} style={{ marginLeft: 2 }}>{n.type}</span>
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={e => handleDelete(e, n._id)}
                      className="btn btn-ghost btn-icon btn-sm"
                      style={{ flexShrink: 0, color: 'var(--text-muted)', alignSelf: 'flex-start' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-state-icon">🔔</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, fontFamily: 'var(--font-display)' }}>All clear!</div>
          <div className="empty-state-text">You have no notifications yet.</div>
        </div>
      )}
    </div>
  )
}
