import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import {
  LayoutDashboard, BookOpen, ClipboardList, Bell,
  MessageSquareText, User, LogOut, Wifi, WifiOff, CalendarCheck
} from 'lucide-react'
import { useSocket } from '../../contexts/SocketContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
  { to: '/assignments', icon: BookOpen, label: 'Assignments' },
  { to: '/notices', icon: ClipboardList, label: 'Notices' },
  { to: '/notifications', icon: Bell, label: 'Notifications', badge: true },
  { to: '/chatbot', icon: MessageSquareText, label: 'AI Assistant' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications() || {}
  const { isConnected } = useSocket() || {}
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
          onClick={onClose}
        />
      )}

      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: 260,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        zIndex: 50,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 14,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}>🎓</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>
                Smart Campus
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>NIMS CAMPUS</div>
            </div>
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {user?.avatar
                ? <img src={user.avatar} style={{ width: '100%', height: '100%', borderRadius: 12, objectFit: 'cover' }} />
                : user?.name?.charAt(0).toUpperCase()
              }
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, truncate: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span className={`badge ${user?.role === 'faculty' ? 'badge-cyan' : 'badge-purple'}`} style={{ padding: '1px 8px', fontSize: 10 }}>
                  {user?.role}
                </span>
                <span title={isConnected ? 'Connected' : 'Offline'}>
                  {isConnected
                    ? <Wifi size={11} color="var(--accent-green)" />
                    : <WifiOff size={11} color="var(--accent-red)" />
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px', overflow: 'auto' }}>
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => window.innerWidth < 768 && onClose()}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10, marginBottom: 4,
                textDecoration: 'none', fontSize: 14, fontWeight: 500,
                color: isActive ? '#a5b4fc' : 'var(--text-secondary)',
                background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                transition: 'all 0.2s',
                position: 'relative',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} color={isActive ? '#a5b4fc' : 'currentColor'} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {badge && unreadCount > 0 && (
                    <span style={{
                      background: 'var(--accent-red)', color: 'white',
                      fontSize: 10, fontWeight: 700,
                      padding: '1px 6px', borderRadius: 20,
                      minWidth: 18, textAlign: 'center',
                    }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleLogout}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', gap: 12, padding: '10px 12px', color: 'var(--accent-red)' }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
