import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, MailCheck, Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button, Input } from '@/components/ui'

type Mode = 'login' | 'register'

export const AuthPage = () => {
  const navigate = useNavigate()
  const { user, signIn, signUp, loading } = useAuthStore()
  const [mode, setMode] = useState<Mode>('login')
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Persist across the email redirect using sessionStorage
  const [verifyEmail, setVerifyEmail] = useState<string>(
    () => sessionStorage.getItem('sm_verify') ?? ''
  )

  const [form, setForm] = useState({ email: '', password: '', username: '', fullName: '' })
  const f = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }))

  // When Supabase confirms email → onAuthStateChange fires → user gets set → navigate home
  useEffect(() => {
    if (user) {
      sessionStorage.removeItem('sm_verify')
      navigate('/')
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (mode === 'login') {
      const err = await signIn(form.email, form.password)
      if (err) setError(err)
    } else {
      if (!form.username.trim() || !form.fullName.trim()) {
        setError('All fields are required')
        return
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
      const result = await signUp(form.email, form.password, form.username.trim(), form.fullName.trim())
      if (result === 'CHECK_EMAIL') {
        sessionStorage.setItem('sm_verify', form.email)
        setVerifyEmail(form.email)
      } else if (result) {
        setError(result)
      }
    }
  }

  // ── Email verification waiting screen ─────────────────────
  if (verifyEmail) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 justify-center mb-8">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white" fill="white" />
            </div>
            <span className="font-bold text-text-1 text-xl">SplitMate</span>
          </div>

          <div className="bg-surface border border-line rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-brand-dim border border-brand/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <MailCheck size={30} className="text-brand" />
            </div>

            <h2 className="text-xl font-bold text-text-1 mb-2">Verify your email</h2>
            <p className="text-sm text-text-3 mb-1">Confirmation link sent to</p>
            <p className="text-sm font-semibold text-text-1 mb-5 bg-raised border border-line rounded-lg px-3 py-2">
              {verifyEmail}
            </p>

            {/* Animated waiting indicator */}
            <div className="flex items-center justify-center gap-2 text-sm text-text-2 bg-raised border border-line rounded-xl px-4 py-3 mb-5">
              <Loader2 size={15} className="animate-spin text-brand flex-shrink-0" />
              <span>Waiting for confirmation…</span>
            </div>

            <p className="text-xs text-text-3 mb-6 leading-relaxed">
              Click the link in the email. This page will automatically take you in once confirmed.
              Check your <span className="text-warn">spam/junk</span> folder if you don't see it.
            </p>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                sessionStorage.removeItem('sm_verify')
                setVerifyEmail('')
                setMode('login')
              }}
            >
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Login / Register form ──────────────────────────────────
  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-white" fill="white" />
          </div>
          <span className="font-bold text-text-1 text-xl">SplitMate</span>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-6">
          {/* Mode tabs */}
          <div className="flex gap-1 bg-base p-1 rounded-xl mb-6 border border-line">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  mode === m
                    ? 'bg-brand text-white'
                    : 'text-text-3 hover:text-text-1'
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
                  onChange={(e) => f('fullName', e.target.value)}
                  required
                />
                <Input
                  label="Username"
                  placeholder="ahmed_khan"
                  value={form.username}
                  onChange={(e) => f('username', e.target.value.toLowerCase().replace(/\s/g, '_'))}
                  required
                />
              </>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => f('email', e.target.value)}
              required
            />

            {/* Password with show/hide */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-2">Password</label>
              <div className="relative flex items-center">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => f('password', e.target.value)}
                  required
                  className="w-full rounded-xl border text-sm px-3 py-2.5 pr-10 bg-raised border-line text-text-1 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 text-text-3 hover:text-text-2 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {mode === 'register' && (
                <p className="text-xs text-text-3">Minimum 6 characters</p>
              )}
            </div>

            {error && (
              <div className="bg-danger-dim border border-danger/20 rounded-xl px-4 py-3">
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full mt-1">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-text-3 mt-5">
          Track money · Split bills · Settle debts
        </p>
      </div>
    </div>
  )
}