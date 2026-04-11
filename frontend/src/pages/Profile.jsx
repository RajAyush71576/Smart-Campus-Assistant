import { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Camera, Save, Shield, User } from 'lucide-react'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', department: user?.department || '', semester: user?.semester || '' })
  const [avatar, setAvatar] = useState(null)
  const [preview, setPreview] = useState(user?.avatar || null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatar(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (avatar) fd.append('avatar', avatar)
    try {
      const { data } = await authAPI.updateProfile(fd)
      updateUser(data.user)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease', maxWidth: 680, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your account information</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 88, height: 88, borderRadius: 24,
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 700, color: 'white',
              overflow: 'hidden', border: '3px solid var(--border)',
            }}>
              {preview
                ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : user?.name?.charAt(0).toUpperCase()
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="btn btn-secondary btn-icon btn-sm"
              style={{ position: 'absolute', bottom: -6, right: -6, width: 28, height: 28, padding: 0 }}>
              <Camera size={13} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          </div>

          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>{user?.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <span className={`badge ${user?.role === 'faculty' ? 'badge-cyan' : 'badge-purple'}`}>
                {user?.role === 'faculty' ? '👨‍🏫' : '👨‍🎓'} {user?.role}
              </span>
              {user?.department && <span className="badge badge-gray">{user?.department}</span>}
              {user?.semester && <span className="badge badge-gray">Sem {user?.semester}</span>}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>

            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input className="input" value={user?.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            </div>

            <div className="grid-2" style={{ gap: 12 }}>
              <div className="input-group">
                <label className="input-label">Department</label>
                <select className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                  <option value="">Select department</option>
                  {['Computer Science','Electronics','Mechanical','Civil','Mathematics','Physics','Chemistry'].map(d =>
                    <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              {user?.role === 'student' && (
                <div className="input-group">
                  <label className="input-label">Semester</label>
                  <select className="input" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}>
                    <option value="">Select semester</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>

            {user?.role === 'student' && user?.rollNumber && (
              <div className="input-group">
                <label className="input-label">Roll Number</label>
                <input className="input" value={user.rollNumber} disabled style={{ opacity: 0.5 }} />
              </div>
            )}

            {user?.role === 'faculty' && user?.employeeId && (
              <div className="input-group">
                <label className="input-label">Employee ID</label>
                <input className="input" value={user.employeeId} disabled style={{ opacity: 0.5 }} />
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
              {saving ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>

      {/* Account info card */}
      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Shield size={18} color="var(--accent)" /> Account Details
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Account Status', value: user?.isActive ? '✅ Active' : '❌ Inactive' },
            { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
            { label: 'Role', value: user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) },
            { label: 'User ID', value: user?._id?.slice(-8).toUpperCase() },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
