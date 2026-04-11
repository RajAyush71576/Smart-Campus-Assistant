import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { noticeAPI } from '../services/api'
import { useSocket } from '../contexts/SocketContext'
import toast from 'react-hot-toast'
import { Plus, X, Pin, Eye, Trash2, Search, Filter } from 'lucide-react'

const CATEGORIES = ['all', 'general', 'exam', 'event', 'holiday', 'urgent', 'placement']
const CAT_EMOJI = { general: '📢', exam: '📝', event: '🎉', holiday: '🏖️', urgent: '🚨', placement: '💼' }
const CAT_BADGE = { general: 'badge-gray', exam: 'badge-amber', event: 'badge-purple', holiday: 'badge-cyan', urgent: 'badge-red', placement: 'badge-green' }

export default function Notices() {
  const { user } = useAuth()
  const isFaculty = user?.role === 'faculty' || user?.role === 'admin'
  const { on, off } = useSocket() || {}
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: 'general', targetAudience: 'all', department: 'all', isPinned: false })

  useEffect(() => { fetchNotices() }, [])

  useEffect(() => {
    if (!on) return
    const handler = (notice) => {
      setNotices(prev => [notice, ...prev])
      toast(`📢 New notice: ${notice.title}`)
    }
    on('newNotice', handler)
    return () => off?.('newNotice', handler)
  }, [on, off])

  const fetchNotices = async () => {
    try {
      const { data } = await noticeAPI.getAll()
      setNotices(data.notices)
    } catch { toast.error('Failed to load notices') }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    try {
      await noticeAPI.create(fd)
      toast.success('Notice posted & users notified!')
      setShowModal(false)
      setForm({ title: '', content: '', category: 'general', targetAudience: 'all', department: 'all', isPinned: false })
      fetchNotices()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this notice?')) return
    try {
      await noticeAPI.delete(id)
      setNotices(prev => prev.filter(n => n._id !== id))
      if (selected?._id === id) setSelected(null)
      toast.success('Notice deleted')
    } catch { toast.error('Failed to delete') }
  }

  const filtered = notices.filter(n => {
    const matchCat = catFilter === 'all' || n.category === catFilter
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><span className="spinner" style={{ width: 36, height: 36 }} /></div>

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notice Board</h1>
          <p className="page-subtitle">Campus announcements and updates</p>
        </div>
        {isFaculty && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Post Notice
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {CATEGORIES.map(c => (
          <button key={c} className={`chip ${catFilter === c ? 'active' : ''}`} onClick={() => setCatFilter(c)}>
            {c !== 'all' && CAT_EMOJI[c]} {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" style={{ paddingLeft: 30, width: 200, height: 34, padding: '0 12px 0 30px' }}
            placeholder="Search notices..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Layout: list + detail */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.2fr' : '1fr', gap: 20, transition: 'all 0.3s' }}>
        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length > 0 ? filtered.map(n => (
            <div key={n._id}
              onClick={() => setSelected(selected?._id === n._id ? null : n)}
              style={{
                padding: '16px 18px', borderRadius: 12, cursor: 'pointer',
                background: selected?._id === n._id ? 'rgba(99,102,241,0.08)' : 'var(--bg-card)',
                border: `1px solid ${selected?._id === n._id ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
                transition: 'all 0.2s',
                display: 'flex', gap: 12,
              }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{CAT_EMOJI[n.category] || '📢'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {n.isPinned && <Pin size={12} color="var(--accent-amber)" />}
                  <span style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.title}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
                  {n.content}
                </p>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className={`badge ${CAT_BADGE[n.category] || 'badge-gray'}`}>{n.category}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {n.author?.name} · {new Date(n.createdAt).toLocaleDateString('en-IN')}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Eye size={11} /> {n.views}
                  </span>
                </div>
              </div>
              {isFaculty && n.author?._id === user._id && (
                <button className="btn btn-ghost btn-icon btn-sm" onClick={e => handleDelete(n._id, e)}
                  style={{ color: 'var(--accent-red)', flexShrink: 0 }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )) : (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-text">No notices {catFilter !== 'all' ? `in "${catFilter}"` : 'yet'}</div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="card" style={{ position: 'sticky', top: 80, height: 'fit-content', animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 24 }}>{CAT_EMOJI[selected.category]}</span>
                  <span className={`badge ${CAT_BADGE[selected.category]}`}>{selected.category}</span>
                  {selected.isPinned && <span className="badge badge-amber"><Pin size={10} /> Pinned</span>}
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>
                  {selected.title}
                </h2>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelected(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, display: 'flex', gap: 12 }}>
              <span>👤 {selected.author?.name}</span>
              <span>📅 {new Date(selected.createdAt).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              <span><Eye size={12} style={{ display: 'inline' }} /> {selected.views}</span>
            </div>

            <div className="divider" />

            <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', marginTop: 16 }}>
              {selected.content}
            </div>

            {selected.attachmentUrl && (
              <div style={{ marginTop: 16 }}>
                <a href={selected.attachmentUrl} target="_blank" rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm">
                  📎 View Attachment
                </a>
              </div>
            )}

            <div style={{ marginTop: 16, padding: '12px', borderRadius: 10, background: 'var(--bg-secondary)', fontSize: 12, color: 'var(--text-muted)' }}>
              Audience: <strong>{selected.targetAudience}</strong> ·
              Dept: <strong>{selected.department}</strong>
              {selected.semester && <> · Sem: <strong>{selected.semester}</strong></>}
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">📢 Post Notice</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">Title *</label>
                  <input className="input" placeholder="Notice title" required
                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Content *</label>
                  <textarea className="input" placeholder="Notice content..." required rows={4}
                    value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
                </div>
                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="input-group">
                    <label className="input-label">Category</label>
                    <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Audience</label>
                    <select className="input" value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}>
                      <option value="all">All</option>
                      <option value="students">Students Only</option>
                      <option value="faculty">Faculty Only</option>
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Department</label>
                  <select className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                    <option value="all">All Departments</option>
                    {['Computer Science','Electronics','Mechanical','Civil','Mathematics','Physics','Chemistry'].map(d =>
                      <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                  <Pin size={14} color="var(--accent-amber)" /> Pin this notice to top
                </label>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Posting...</> : '📢 Post Notice'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
