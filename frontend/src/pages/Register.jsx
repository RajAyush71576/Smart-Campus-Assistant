import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'student',
    department: '', rollNumber: '', employeeId: '', semester: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await register(form)
      toast.success(`Welcome, ${user.name}! 🎉`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 20,
      backgroundImage: `radial-gradient(ellipse at 80% 50%, rgba(99,102,241,0.08) 0%, transparent 60%)`,
    }}>
      <div style={{ width: '100%', maxWidth: 480, animation: 'fadeInUp 0.5s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, marginBottom: 12,
          }}>🎓</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800 }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Join Smart Campus today</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Role toggle */}
              <div>
                <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>I am a</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['student', 'faculty'].map(r => (
                    <button key={r} type="button"
                      onClick={() => set('role', r)}
                      className={`btn btn-sm ${form.role === r ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      {r === 'student' ? '👨‍🎓' : '👨‍🏫'} {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid-2" style={{ gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input className="input" placeholder="John Doe" value={form.name}
                    onChange={e => set('name', e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Department</label>
                  <select className="input" value={form.department} onChange={e => set('department', e.target.value)} required>
                    <option value="">Select dept.</option>
                    {['Computer Science','Electronics','Mechanical','Civil','Mathematics','Physics','Chemistry'].map(d =>
                      <option key={d} value={d}>{d}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Email</label>
                <input type="email" className="input" placeholder="you@campus.edu"
                  value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>

              {form.role === 'student' && (
                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="input-group">
                    <label className="input-label">Roll Number</label>
                    <input className="input" placeholder="CS2024001" value={form.rollNumber}
                      onChange={e => set('rollNumber', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Semester</label>
                    <select className="input" value={form.semester} onChange={e => set('semester', e.target.value)} required>
                      <option value="">Semester</option>
                      {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {form.role === 'faculty' && (
                <div className="input-group">
                  <label className="input-label">Employee ID</label>
                  <input className="input" placeholder="FAC001" value={form.employeeId}
                    onChange={e => set('employeeId', e.target.value)} />
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} className="input"
                    placeholder="Min. 6 characters" style={{ paddingRight: 44 }}
                    value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Creating...</> : 'Create Account →'}
              </button>
            </div>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-muted)', fontSize: 14 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
