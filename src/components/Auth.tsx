import { FormEvent, useEffect, useState } from 'react'
import { Mail, Lock, UserRound, Eye, EyeClosed, ArrowRight, ChevronLeft, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function Auth({ onBypass }: { onBypass?: () => void }) {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    document.documentElement.classList.add('auth-active')
    document.body.classList.add('auth-active')
    return () => {
      document.documentElement.classList.remove('auth-active')
      document.body.classList.remove('auth-active')
    }
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    let error

    try {
      if (mode === 'login') {
        ;({ error } = await supabase.auth.signInWithPassword({ email, password }))
      } else if (mode === 'register') {
        ;({ error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        }))
      } else {
        ;({ error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: location.origin,
        }))
      }

      if (error) {
        setMessage(error.message)
      } else {
        setMessage(
          mode === 'reset'
            ? 'Revisá tu correo para continuar.'
            : mode === 'register'
              ? 'Cuenta creada con éxito.'
              : '',
        )
      }
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('fetch') || msg.includes('NetworkError') || msg.includes('Failed to fetch')) {
        setMessage('No se pudo conectar con la base de datos de Supabase. Podés pulsar abajo en "Entrar directo al panel" para ingresar al sistema.')
      } else {
        setMessage(msg || 'Error de conexión')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-custom-wrapper">
      <div className="auth-bg-gradient" />

      <div className="auth-card-container">
        <div className="auth-glass-card">
          {/* Header */}
          <div className="auth-header">
            {mode === 'reset' && (
              <button type="button" className="auth-back-btn" onClick={() => setMode('login')}>
                <ChevronLeft className="w-4 h-4" /> Volver
              </button>
            )}

            <div className="auth-brand-logo">
              <img src="/brand/jcb-wordmark.png" alt="JCB Development" className="auth-logo-img" />
            </div>

            <h1>{mode === 'login' ? 'Bienvenido' : mode === 'register' ? 'Crear cuenta' : 'Recuperar acceso'}</h1>
            <p>
              {mode === 'login'
                ? 'Ingresá para administrar tu negocio.'
                : mode === 'register'
                  ? 'Empezá a controlar tus finanzas.'
                  : 'Te enviaremos un enlace de recuperación.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="auth-form-space">
            {mode === 'register' && (
              <div className="auth-input-group">
                <UserRound className="auth-input-icon" />
                <input
                  required
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="auth-input-group">
              <Mail className="auth-input-icon" />
              <input
                required
                type="email"
                placeholder="nombre@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {mode !== 'reset' && (
              <div className="auth-input-group">
                <Lock className="auth-input-icon" />
                <input
                  required
                  minLength={6}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña (mín. 6 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeClosed className="w-4 h-4" />}
                </button>
              </div>
            )}

            {message && <div className="auth-feedback-msg">{message}</div>}

            <button type="submit" disabled={busy} className="auth-primary-btn">
              {busy ? (
                <Loader2 className="w-4 h-4 spin inline" />
              ) : (
                <span className="flex-center">
                  {mode === 'login' ? 'Ingresar' : mode === 'register' ? 'Registrarme' : 'Enviar enlace'}
                  <ArrowRight className="w-4 h-4 ml-1.5 inline" />
                </span>
              )}
            </button>

            {onBypass && (
              <button
                type="button"
                className="auth-bypass-btn"
                onClick={onBypass}
              >
                Entrar directo al panel
              </button>
            )}

            {mode === 'login' && (
              <button type="button" className="auth-forgot-link" onClick={() => setMode('reset')}>
                ¿Olvidaste tu contraseña?
              </button>
            )}

            <div className="auth-switch-footer">
              <span>{mode === 'register' ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}</span>
              <button
                type="button"
                onClick={() => {
                  setMessage('')
                  setMode(mode === 'register' ? 'login' : 'register')
                }}
              >
                {mode === 'register' ? 'Ingresar' : 'Registrarme'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
