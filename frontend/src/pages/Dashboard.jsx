import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { attendanceAPI, assignmentAPI, noticeAPI, notificationAPI } from '../services/api'
import { useSocket } from '../contexts/SocketContext'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, ClipboardList, Bell, CalendarCheck,
  TrendingUp, Users, FileText, AlertCircle, CheckCircle2
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function Dashboard() {
  const { user } = useAuth()
  const { on, off } = useSocket() || {}
  const navigate = useNavigate()
  const isStudent = user?.role === 'student'
  const isFaculty = user?.role === 'faculty'

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    attendanceSummary: {},
    assignments: [],
    notices: [],
    stats: null,
    recentAttendance: [],
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (!on) return
    const handler = () => fetchDashboardData()
    on('newNotice', handler)
    on('attendanceUpdate', handler)
    return () => { off?.('newNotice', handler); off?.('attendanceUpdate', handler) }
  }, [on, off])

  const fetchDashboardData = async () => {
    try {
      const [assignRes, noticeRes] = await Promise.all([
        assignmentAPI.getAll(),
        noticeAPI.getAll(),
      ])
      const newData = {
        assignments: assignRes.data.assignments.slice(0, 5),
        notices: noticeRes.data.notices.slice(0, 5),
        attendanceSummary: {},
        stats: null,
        recentAttendance: [],
      }

      if (isStudent) {
        const attRes = await attendanceAPI.getStudentAttendance('me')
        newData.attendanceSummary = attRes.data.summary
      }

      if (isFaculty) {
        const statsRes = await notificationAPI.getFacultyStats()
        newData.stats = statsRes.data.stats
        newData.recentAttendance = statsRes.data.recentAttendance
      }

      setData(newData)
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const overallAttendance = () => {
    const subjects = Object.values(data.attendanceSummary)
    if (!subjects.length) return 0
    const avg = subjects.reduce((a, s) => a + s.percentage, 0) / subjects.length
    return Math.round(avg)
  }

  const attendanceChartData = Object.entries(data.attendanceSummary).map(([subj, s]) => ({
    name: subj.length > 10 ? subj.slice(0, 10) + '…' : subj,
    percentage: s.percentage,
    present: s.present,
    total: s.total,
  }))

  const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <span className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  )

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},{' '}
            <span className="text-gradient">{user?.name?.split(' ')[0]}!</span>
          </h1>
          <p className="page-subtitle">
            {isStudent
              ? `Semester ${user?.semester} · ${user?.department}`
              : `Faculty · ${user?.department}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 20,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            fontSize: 13, color: 'var(--text-secondary)',
          }}>
            📅 {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ── STUDENT DASHBOARD ─────────────────────────────── */}
      {isStudent && (
        <>
          {/* Stat cards */}
          <div className="grid-4" style={{ marginBottom: 24 }}>
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/attendance')}>
              <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
                <CalendarCheck size={22} color="#a5b4fc" />
              </div>
              <div>
                <div className="stat-value" style={{ color: overallAttendance() >= 75 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {overallAttendance()}%
                </div>
                <div className="stat-label">Avg. Attendance</div>
              </div>
            </div>

            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/assignments')}>
              <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)' }}>
                <BookOpen size={22} color="#c4b5fd" />
              </div>
              <div>
                <div className="stat-value">{data.assignments.length}</div>
                <div className="stat-label">Assignments</div>
              </div>
            </div>

            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/notices')}>
              <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.15)' }}>
                <ClipboardList size={22} color="#67e8f9" />
              </div>
              <div>
                <div className="stat-value">{data.notices.length}</div>
                <div className="stat-label">Notices</div>
              </div>
            </div>

            <div className="stat-card" onClick={() => navigate('/chatbot')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>
                <span style={{ fontSize: 22 }}>🤖</span>
              </div>
              <div>
                <div className="stat-value" style={{ fontSize: 18 }}>AI Help</div>
                <div className="stat-label">Ask Anything</div>
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 24 }}>
            {/* Attendance chart */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarCheck size={18} color="var(--accent)" /> Attendance by Subject
              </h3>
              {attendanceChartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={attendanceChartData} barSize={28}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }}
                        formatter={(v) => [`${v}%`, 'Attendance']}
                      />
                      <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                        {attendanceChartData.map((_, i) => (
                          <Cell key={i} fill={_.percentage >= 75 ? '#6366f1' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: '#6366f1', display: 'inline-block' }} /> ≥75% (Safe)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} /> &lt;75% (Warning)
                    </span>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📊</div>
                  <div className="empty-state-text">No attendance data yet</div>
                </div>
              )}
            </div>

            {/* Upcoming assignments */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={18} color="var(--accent)" /> Upcoming Assignments
              </h3>
              {data.assignments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.assignments.map((a) => {
                    const due = new Date(a.dueDate)
                    const isOverdue = due < new Date()
                    const daysLeft = Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24))
                    return (
                      <div key={a._id} style={{
                        padding: '12px 14px', borderRadius: 10,
                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.title}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.subject}</div>
                        </div>
                        <span className={`badge ${isOverdue ? 'badge-red' : daysLeft <= 3 ? 'badge-amber' : 'badge-green'}`}>
                          {isOverdue ? 'Overdue' : `${daysLeft}d left`}
                        </span>
                      </div>
                    )
                  })}
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/assignments')} style={{ marginTop: 4, width: '100%', justifyContent: 'center' }}>
                    View All →
                  </button>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">✅</div>
                  <div className="empty-state-text">No pending assignments!</div>
                </div>
              )}
            </div>
          </div>

          {/* Recent notices */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={18} color="var(--accent)" /> Recent Notices
            </h3>
            {data.notices.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.notices.map((n) => (
                  <div key={n._id} style={{
                    padding: '14px 16px', borderRadius: 10,
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    cursor: 'pointer',
                  }} onClick={() => navigate('/notices')}>
                    <span style={{ fontSize: 20 }}>
                      {n.category === 'urgent' ? '🚨' : n.category === 'exam' ? '📝' : n.category === 'event' ? '🎉' : '📢'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                        {n.isPinned && <span>📌</span>}
                        {n.title}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.content}
                      </div>
                    </div>
                    <span className={`badge ${
                      n.category === 'urgent' ? 'badge-red' :
                      n.category === 'exam' ? 'badge-amber' :
                      n.category === 'event' ? 'badge-purple' : 'badge-gray'
                    }`}>{n.category}</span>
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/notices')} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                  View All →
                </button>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📢</div>
                <div className="empty-state-text">No notices yet</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── FACULTY DASHBOARD ─────────────────────────────── */}
      {isFaculty && (
        <>
          <div className="grid-3" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
                <BookOpen size={22} color="#a5b4fc" />
              </div>
              <div>
                <div className="stat-value">{data.stats?.assignmentCount ?? 0}</div>
                <div className="stat-label">Assignments Posted</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
                <Users size={22} color="#6ee7b7" />
              </div>
              <div>
                <div className="stat-value">{data.stats?.studentCount ?? 0}</div>
                <div className="stat-label">Total Students</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>
                <FileText size={22} color="#fcd34d" />
              </div>
              <div>
                <div className="stat-value">{data.stats?.noticeCount ?? 0}</div>
                <div className="stat-label">Notices Posted</div>
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 24 }}>
            {/* Quick Actions */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>⚡ Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: '📋 Mark Attendance', desc: 'Record student attendance for today', path: '/attendance' },
                  { label: '📤 Upload Assignment', desc: 'Share assignments with students', path: '/assignments' },
                  { label: '📢 Post Notice', desc: 'Send announcements to students', path: '/notices' },
                ].map(item => (
                  <button key={item.path} className="btn btn-secondary"
                    onClick={() => navigate(item.path)}
                    style={{ justifyContent: 'flex-start', flexDirection: 'column', alignItems: 'flex-start', padding: '12px 16px', height: 'auto' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginTop: 2 }}>{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Attendance */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>
                <CalendarCheck size={18} color="var(--accent)" style={{ display: 'inline', marginRight: 8 }} />
                Recent Attendance
              </h3>
              {data.recentAttendance.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.recentAttendance.slice(0, 6).map((r) => (
                    <div key={r._id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 8,
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.student?.name || 'Student'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.subject} · {new Date(r.date).toLocaleDateString()}</div>
                      </div>
                      <span className={`badge ${r.status === 'present' ? 'badge-green' : r.status === 'late' ? 'badge-amber' : 'badge-red'}`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-text">No attendance records yet</div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Assignments */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>📚 Your Recent Assignments</h3>
            {data.assignments.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Subject</th>
                      <th>Due Date</th>
                      <th>Downloads</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.assignments.map(a => {
                      const isOverdue = new Date(a.dueDate) < new Date()
                      return (
                        <tr key={a._id}>
                          <td style={{ fontWeight: 500 }}>{a.title}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{a.subject}</td>
                          <td>{new Date(a.dueDate).toLocaleDateString()}</td>
                          <td>📥 {a.downloads}</td>
                          <td><span className={`badge ${isOverdue ? 'badge-red' : 'badge-green'}`}>{isOverdue ? 'Overdue' : 'Active'}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📤</div>
                <div className="empty-state-text">No assignments posted yet</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
