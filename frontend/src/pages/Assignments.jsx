import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { assignmentAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Upload, Download, Trash2, FileText, X, Plus, Calendar, Search } from 'lucide-react'

export default function Assignments() {
  const { user } = useAuth()
  const isFaculty = user?.role === 'faculty'
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', subject: '', department: user?.department || '', semester: user?.semester || '', dueDate: '' })
  const [file, setFile] = useState(null)
  const fileRef = useRef()

  useEffect(() => { fetchAssignments() }, [])

  const fetchAssignments = async () => {
    try {
      const { data } = await assignmentAPI.getAll()
      setAssignments(data.assignments)
    } catch { toast.error('Failed to load assignments') }
    finally { setLoading(false) }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a file')
    setSubmitting(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    fd.append('file', file)
    try {
      await assignmentAPI.upload(fd)
      toast.success('Assignment uploaded & students notified!')
      setShowModal(false)
      setForm({ title: '', description: '', subject: '', department: user?.department || '', semester: user?.semester || '', dueDate: '' })
      setFile(null)
      fetchAssignments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally { setSubmitting(false) }
  }

  const handleDownload = async (a) => {
    try {
      const { data } = await assignmentAPI.trackDownload(a._id)
      window.open(data.fileUrl, '_blank')
      setAssignments(prev => prev.map(x => x._id === a._id ? { ...x, downloads: x.downloads + 1 } : x))
      toast.success('Download started!')
    } catch { toast.error('Download failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this assignment?')) return
    try {
      await assignmentAPI.delete(id)
      toast.success('Assignment deleted')
      setAssignments(prev => prev.filter(a => a._id !== id))
    } catch { toast.error('Failed to delete') }
  }

  const filtered = assignments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.subject.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><span className="spinner" style={{ width: 36, height: 36 }} /></div>

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Assignments</h1>
          <p className="page-subtitle">{isFaculty ? 'Upload and manage assignments' : 'Download your assignments'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: 36, width: 220 }} placeholder="Search assignments..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {isFaculty && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Upload Assignment
            </button>
          )}
        </div>
      </div>

      {/* Grid of assignment cards */}
      {filtered.length > 0 ? (
        <div className="grid-3">
          {filtered.map(a => {
            const due = new Date(a.dueDate)
            const isOverdue = due < new Date()
            const daysLeft = Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24))

            return (
              <div key={a._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Top */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(99,102,241,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <FileText size={22} color="#a5b4fc" />
                  </div>
                  <span className={`badge ${isOverdue ? 'badge-red' : daysLeft <= 3 ? 'badge-amber' : 'badge-green'}`}>
                    {isOverdue ? '🔴 Overdue' : daysLeft === 0 ? '🟡 Today' : `${daysLeft}d left`}
                  </span>
                </div>

                {/* Info */}
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{a.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {a.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <span className="badge badge-purple">{a.subject}</span>
                    <span className="badge badge-gray">Sem {a.semester}</span>
                    <span className="badge badge-gray">{a.department}</span>
                  </div>
                </div>

                {/* Meta */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>📅 Due: {due.toLocaleDateString('en-IN')}</span>
                  <span>📥 {a.downloads} downloads</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleDownload(a)}>
                    <Download size={14} /> Download
                  </button>
                  {isFaculty && a.faculty._id === user._id && (
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(a._id)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Faculty name */}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
                  By {a.faculty?.name}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-text">{search ? 'No assignments match your search' : 'No assignments yet'}</div>
          {isFaculty && !search && (
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
              <Upload size={16} /> Upload First Assignment
            </button>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2 className="modal-title">📤 Upload Assignment</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleUpload}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">Title *</label>
                  <input className="input" placeholder="Assignment title" required
                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>

                <div className="input-group">
                  <label className="input-label">Description *</label>
                  <textarea className="input" placeholder="Assignment instructions..." required rows={3}
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>

                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="input-group">
                    <label className="input-label">Subject *</label>
                    <input className="input" placeholder="e.g. Data Structures" required
                      value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Semester *</label>
                    <select className="input" required value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}>
                      <option value="">Select</option>
                      {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="input-group">
                    <label className="input-label">Department *</label>
                    <select className="input" required value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                      <option value="">Select</option>
                      {['Computer Science','Electronics','Mechanical','Civil','Mathematics','Physics','Chemistry'].map(d =>
                        <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Due Date *</label>
                    <input type="date" className="input" required
                      min={new Date().toISOString().split('T')[0]}
                      value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                  </div>
                </div>

                {/* File upload */}
                <div className="input-group">
                  <label className="input-label">File (PDF/DOC) *</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    style={{
                      border: `2px dashed ${file ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 12, padding: '20px', textAlign: 'center', cursor: 'pointer',
                      background: file ? 'rgba(99,102,241,0.05)' : 'var(--bg-secondary)',
                      transition: 'all 0.2s',
                    }}>
                    {file ? (
                      <div>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>📄</div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{file.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    ) : (
                      <div>
                        <Upload size={24} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Click to select file</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>PDF, DOC, DOCX up to 10MB</div>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                    onChange={e => setFile(e.target.files[0])} />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Uploading...</> : <><Upload size={16} /> Upload</>}
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
