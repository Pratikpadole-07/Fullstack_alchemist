import { useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Camera, Save } from 'lucide-react'
import Card from '../../components/ui/Card.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { api } from '../../services/api.js'

const roles = ['User', 'Professional', 'Public Figure']

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const fileRef = useRef(null)

  const [name, setName] = useState(user?.name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [role, setRole] = useState(user?.role || 'User')
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const previewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file)
    return user?.profileImage ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.profileImage}` : null
  }, [file, user?.profileImage])

  async function onSave() {
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('bio', bio)
      fd.append('role', role)
      if (file) fd.append('profileImage', file)
      const { data } = await api.put('/api/users/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUser(data.user)
      setFile(null)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-white/60">Profile</div>
            <div className="mt-1 text-2xl font-semibold">Your public identity</div>
            <p className="mt-2 text-sm text-white/70">Keep it polished—this improves trust and reduces false reports.</p>
          </div>
          <Button onClick={onSave} disabled={submitting}>
            <Save className="h-4 w-4" />
            {submitting ? 'Saving…' : 'Save changes'}
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold">Profile photo</div>
            <div className="mt-4 grid place-items-center">
              <div className="relative">
                <div className="h-32 w-32 overflow-hidden rounded-3xl border border-white/15 bg-white/10">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm text-white/60">No photo</div>
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/15"
                  type="button"
                >
                  <Camera className="h-4 w-4" />
                  Upload
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <div className="mt-6 text-xs text-white/55">PNG/JPG recommended. Use a clear headshot.</div>
          </div>

          <div className="space-y-4">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />

            <label className="block">
              <div className="mb-1.5 text-sm font-medium text-white/85">Bio</div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                className="w-full resize-none rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/45 shadow-glass outline-none transition focus:border-blue-400/40 focus:ring-2 focus:ring-blue-400/30"
                placeholder="Write a short description about yourself…"
              />
              <div className="mt-1.5 text-xs text-white/55">Keep it concise. Professional tone recommended.</div>
            </label>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold">Role</div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={[
                      'rounded-2xl border px-4 py-3 text-sm transition',
                      role === r
                        ? 'border-white/20 bg-white/15 text-white'
                        : 'border-white/10 bg-white/5 text-white/75 hover:bg-white/10',
                    ].join(' ')}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

