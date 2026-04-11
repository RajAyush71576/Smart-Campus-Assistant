import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Menu, X } from 'lucide-react'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main style={{
        flex: 1,
        marginLeft: window.innerWidth >= 768 ? 260 : 0,
        minHeight: '100vh',
        transition: 'margin-left 0.3s',
      }}>
        {/* Top bar */}
        <div style={{
          height: 56,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 12,
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={{
            height: 28, width: 1,
            background: 'var(--border)',
          }} />
          <div style={{
            height: 6, width: 6, borderRadius: '50%',
            background: 'var(--accent-green)',
            boxShadow: '0 0 8px rgba(16,185,129,0.6)',
          }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Live</span>
        </div>

        {/* Page content */}
        <div style={{ padding: '28px 28px', maxWidth: 1400, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
