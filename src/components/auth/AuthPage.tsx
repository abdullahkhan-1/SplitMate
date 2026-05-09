import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Coins } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button, Input } from '@/components/ui'

type Mode = 'login' | 'register'

export const AuthPage = () => {
  const navigate = useNavigate()
  const { signIn, signUp, loading } = useAuthStore()
  const [mode, setMode] = useState<Mode>('login')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    email: '', password: '', username: '', fullName: '',
  })

  const set = (key: keyof typeof form, val: string) =>
    setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    let err: string | null = null
    if (mode === 'login') {
      err = await signIn(form.email, form.password)
    } else {
      if (!form.username.trim() || !form.fullName.trim()) {
        setError('All fields are required')
        return
      }
      err = await signUp(form.email, form.password, form.username.trim(), form.fullName.trim())
    }
    if (err) setError(err)
    else navigate('/')
  }

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 bg-ink-900 rounded-2xl flex items-center justify-center">
            <Coins size={20} className="text-brand" />
          </div>
          <h1 className="font-display font-bold text-2xl text-ink-900">SplitMate</h1>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm">
          {/* Mode toggle */}
          <div className="flex gap-1 bg-ink-50 p-1 rounded-xl mb-6">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  mode === m
                    ? 'bg-white text-ink-900 shadow-sm'
                    : 'text-ink-400 hover:text-ink-600'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <>
                <Input
                  label="Full Name"
                  placeholder="Ahmed Khan"
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  required
                />
                <Input
                  label="Username"
                  placeholder="ahmed_khan"
                  value={form.username}
                  onChange={(e) => set('username', e.target.value.toLowerCase().replace(/\s/g, '_'))}
                  required
                />
              </>
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              required
              hint={mode === 'register' ? 'Minimum 6 characters' : undefined}
            />

            {error && (
              <p className="text-sm text-danger bg-danger-light px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full mt-1">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-ink-400 mt-4">
          Track your money. Split fairly. Settle easily.
        </p>
      </div>
    </div>
  )
}