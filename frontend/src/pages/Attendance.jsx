import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { attendanceAPI } from '../services/api'
import toast from 'react-hot-toast'
import { CalendarCheck, CheckCircle2, XCircle, Clock, Users, BarChart2 } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts'

export default function Attendance() {
  const { user } = useAuth()
  const isStudent = user?.role === 'student'
  const [loading, setLoading] = useState(true)

  // Student state
  const [attendance, setAttendance] = useState([])
  const [summary, setSummary] = useState({})

  // Faculty state
  const [students, setStudents] = useState([])
  const [markForm, setMarkForm] = useState({ subject: '', date: new Date().toISOString().split('T')[0] })
  const [attendanceMap, setAttendanceMap] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [analyticsData, setAnalyticsData] = useState({ records: [], stats: {} })
  const [activeTab, setActiveTab] = useState('mark') // mark | analytics

  useEffect(() => {
    if (isStudent) fetchStudentAttendance()
    else fetchFacultyData()
  }, [])

  const fetchStudentAttendance = async () => {
    try {
      const { data } = await attendanceAPI.getStudentAttendance('me')
      setAttendance(data.attendance)
      setSummary(data.summary)
    } catch { toast.error('Failed to load attendance') }
    finally { setLoading(false) }
  }

  const fetchFacultyData = async () => {
    try {
      const [stuRes, anaRes] = await Promise.all([
        attendanceAPI.getStudents(),
        attendanceAPI.getAnalytics(),
      ])
      setStudents(stuRes.data.students)
      setAnalyticsData(anaRes.data)
      // Default all to present
      const map = {}
      stuRes.data.students.forEach(s => { map[s._id] = 'present' })
      setAttendanceMap(map)
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  const fetchAnalytics = async () => {
    try {
      const { data } = await attendanceAPI.getAnalytics({ subject: markForm.subject, date: markForm.date })
      setAnalyticsData(data)
    } catch {}
  }

  const handleBulkMark = async () => {
    if (!markForm.subject) return toast.error('Please enter a subject')
    setSubmitting(true)
    try {
      const records = Object.entries(attendanceMap).map(([studentId, status]) => ({ studentId, status }))
      await attendanceAPI.markBulk({ records, subject: markForm.subject, date: markForm.date })
      toast.success(`Attendance marked for ${records.length} students!`)
      fetchAnalytics()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance')
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <span className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  )

  // ─── STUDENT VIEW ─────────────────────────────────────────
  if (isStudent) {
    const subjects = Object.entries(summary)
    const overall = subjects.length
      ? Math.round(subjects.reduce((a, [, s]) => a + s.percentage, 0) / subjects.length)
      : 0

    return (
      <div style={{ animation: 'fadeInUp 0.4s ease' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">My Attendance</h1>
            <p className="page-subtitle">Track your class attendance across all subjects</p>
          </div>
        </div>

        {/* Overall circle */}
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', width: 120, height: 120 }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--bg-secondary)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none"
                  stroke={overall >= 75 ? '#10b981' : overall >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10" strokeDasharray={`${(overall / 100) * 314} 314`}
                  style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
                color: overall >= 75 ? 'var(--accent-green)' : overall >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)',
              }}>{overall}%</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                Overall Attendance
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {overall >= 75 ? '✅ You\'re doing great!' : overall >= 60 ? '⚠️ Attendance is low' : '🚨 Critical attendance!'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Minimum required: 75%
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Total Classes', value: attendance.length, icon: '📊' },
                { label: 'Present', value: attendance.filter(a => a.status === 'present').length, icon: '✅' },
                { label: 'Absent', value: attendance.filter(a => a.status === 'absent').length, icon: '❌' },
                { label: 'Late', value: attendance.filter(a => a.status === 'late').length, icon: '⏰' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.icon} {item.label}</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: 16 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subject breakdown */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Subject-wise Attendance</h3>
          {subjects.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {subjects.map(([subj, s]) => (
                <div key={subj}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{subj}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.present}/{s.total}</span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: s.percentage >= 75 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {s.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${s.percentage}%`,
                      background: s.percentage >= 75
                        ? 'linear-gradient(90deg, #059669, #10b981)'
                        : s.percentage >= 60
                        ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                        : 'linear-gradient(90deg, #dc2626, #ef4444)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-text">No attendance records yet. Check back after classes begin.</div>
            </div>
          )}
        </div>

        {/* Attendance history */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Recent History</h3>
          {attendance.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Faculty</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.slice(0, 20).map(r => (
                    <tr key={r._id}>
                      <td>{new Date(r.date).toLocaleDateString('en-IN')}</td>
                      <td style={{ fontWeight: 500 }}>{r.subject}</td>
                      <td>
                        <span className={`badge ${r.status === 'present' ? 'badge-green' : r.status === 'late' ? 'badge-amber' : 'badge-red'}`}>
                          {r.status === 'present' ? '✅' : r.status === 'late' ? '⏰' : '❌'} {r.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r.faculty?.name || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{r.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">No attendance history</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── FACULTY VIEW ─────────────────────────────────────────
  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Management</h1>
          <p className="page-subtitle">Mark and track student attendance</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['mark', 'analytics'].map(tab => (
            <button key={tab} className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveTab(tab); if (tab === 'analytics') fetchAnalytics() }}>
              {tab === 'mark' ? '✏️ Mark' : '📊 Analytics'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'mark' && (
        <>
          {/* Form */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Session Details</h3>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="input-group">
                <label className="input-label">Subject</label>
                <input className="input" placeholder="e.g. Data Structures"
                  value={markForm.subject} onChange={e => setMarkForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Date</label>
                <input type="date" className="input"
                  value={markForm.date} onChange={e => setMarkForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Quick select row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => {
              const m = {}; students.forEach(s => { m[s._id] = 'present' }); setAttendanceMap(m)
            }}><CheckCircle2 size={14} /> All Present</button>
            <button className="btn btn-secondary btn-sm" onClick={() => {
              const m = {}; students.forEach(s => { m[s._id] = 'absent' }); setAttendanceMap(m)
            }}><XCircle size={14} /> All Absent</button>
            <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={14} /> {students.length} students
            </span>
          </div>

          {/* Students list */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {students.length > 0 ? students.map(s => (
                <div key={s._id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 10,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0,
                  }}>{s.name.charAt(0)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.rollNumber} · Sem {s.semester}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['present', 'late', 'absent'].map(st => (
                      <button key={st}
                        onClick={() => setAttendanceMap(m => ({ ...m, [s._id]: st }))}
                        className={`btn btn-sm ${attendanceMap[s._id] === st
                          ? st === 'present' ? 'btn-primary' : st === 'late' ? '' : 'btn-danger'
                          : 'btn-ghost'
                        }`}
                        style={{
                          background: attendanceMap[s._id] === st
                            ? st === 'late' ? 'rgba(245,158,11,0.2)' : undefined
                            : undefined,
                          color: attendanceMap[s._id] === st && st === 'late' ? '#fcd34d' : undefined,
                          border: attendanceMap[s._id] === st && st === 'late' ? '1px solid rgba(245,158,11,0.3)' : undefined,
                        }}
                      >
                        {st === 'present' ? '✅' : st === 'late' ? '⏰' : '❌'} {st}
                      </button>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="empty-state">
                  <div className="empty-state-icon">👥</div>
                  <div className="empty-state-text">No students found</div>
                </div>
              )}
            </div>
          </div>

          <button className="btn btn-primary btn-lg" disabled={submitting || !students.length} onClick={handleBulkMark}
            style={{ width: '100%', justifyContent: 'center' }}>
            {submitting ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Submitting...</> : `✅ Submit Attendance (${students.length} students)`}
          </button>
        </>
      )}

      {activeTab === 'analytics' && (
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Attendance Analytics</h3>
          <div className="grid-3" style={{ marginBottom: 24 }}>
            {[
              { label: 'Total', val: analyticsData.stats?.total ?? 0, color: 'var(--accent)' },
              { label: 'Present', val: analyticsData.stats?.present ?? 0, color: 'var(--accent-green)' },
              { label: 'Absent', val: analyticsData.stats?.absent ?? 0, color: 'var(--accent-red)' },
            ].map(item => (
              <div key={item.label} style={{
                padding: '16px', borderRadius: 12,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: item.color }}>{item.val}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{item.label}</div>
              </div>
            ))}
          </div>
          {analyticsData.records.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Student</th><th>Roll No.</th><th>Subject</th><th>Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {analyticsData.records.map(r => (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 500 }}>{r.student?.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{r.student?.rollNumber}</td>
                      <td>{r.subject}</td>
                      <td>{new Date(r.date).toLocaleDateString('en-IN')}</td>
                      <td><span className={`badge ${r.status === 'present' ? 'badge-green' : r.status === 'late' ? 'badge-amber' : 'badge-red'}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-text">No analytics data. Mark attendance first.</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
