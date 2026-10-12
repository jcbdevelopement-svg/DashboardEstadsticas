import { FormEvent, useEffect, useState } from 'react'
import { Mail, Lock, UserRound, Eye, EyeClosed, ArrowRight, ChevronLeft, Loader2, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'

const productionUrl = 'https://dashboard-estadisticas-7pn.pages.dev'
const authRedirectUrl = ['localhost', '127.0.0.1'].includes(location.hostname)
  ? location.origin
  : productionUrl

export function Auth() {
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

    if (mode === 'login') {
      ;({ error } = await supabase.auth.signInWithPassword({ email, password }))
    } else if (mode === 'register') {
      ;({ error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name }, emailRedirectTo: authRedirectUrl },
      }))
    } else {
      ;({ error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: authRedirectUrl,
      }))
    }

    if (error) {
      setMessage(error.message)
    } else {
      setMessage(
        mode === 'reset'
          ? 'Revisá tu correo para continuar.'
          : mode === 'register'
            ? 'Cuenta creada. Revisá tu correo para confirmar tu email.'
            : '',
      )
    }
    setBusy(false)
  }

  return (
    <div className="auth-clean-shell">
      <div className="auth-clean-card">
        {/* Top Header */}
        <div className="auth-clean-header">
          {mode === 'reset' && (
            <button type="button" className="auth-clean-back" onClick={() => setMode('login')}>
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
          )}

          <div className="auth-clean-brand">
            <img src="/brand/jcb-wordmark.png" alt="JCB Developement" className="auth-clean-logo" />
          </div>

          <h1 className="auth-clean-title">
            {mode === 'login' ? 'Iniciar sesión' : mode === 'register' ? 'Crear cuenta' : 'Recuperar contraseña'}
          </h1>
          <p className="auth-clean-subtitle">
            {mode === 'login'
              ? 'Ingresá tus credenciales para acceder al panel.'
              : mode === 'register'
                ? 'Completá tus datos para comenzar a administrar.'
                : 'Ingresá tu correo para recibir las instrucciones.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="auth-clean-form">
          {mode === 'register' && (
            <div className="auth-field">
              <label htmlFor="auth-name">Nombre completo</label>
              <div className="auth-input-wrapper">
                <UserRound className="auth-field-icon" />
                <input
                  id="auth-name"
                  required
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Correo electrónico</label>
            <div className="auth-input-wrapper">
              <Mail className="auth-field-icon" />
              <input
                id="auth-email"
                required
                type="email"
                placeholder="ejemplo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div className="auth-field">
              <div className="auth-field-row">
                <label htmlFor="auth-password">Contraseña</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    className="auth-link-subtle"
                    onClick={() => {
                      setMessage('')
                      setMode('reset')
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="auth-input-wrapper">
                <Lock className="auth-field-icon" />
                <input
                  id="auth-password"
                  required
                  minLength={6}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="auth-eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeClosed className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {message && (
            <div className="auth-clean-alert" role="alert">
              {message}
            </div>
          )}

          {/* Action button */}
          <button type="submit" disabled={busy} className="auth-clean-submit">
            {busy ? (
              <span className="auth-btn-flex">
                <Loader2 className="w-4 h-4 spin" /> Procesando...
              </span>
            ) : (
              <span className="auth-btn-flex">
                {mode === 'login' ? 'Ingresar al sistema' : mode === 'register' ? 'Registrarme' : 'Enviar instrucciones'}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </span>
            )}
          </button>

          {/* Mode switch footer */}
          <div className="auth-clean-footer">
            <span>
              {mode === 'register' ? '¿Ya tenés una cuenta?' : '¿No tenés una cuenta todavía?'}
            </span>
            <button
              type="button"
              className="auth-switch-btn"
              onClick={() => {
                setMessage('')
                setMode(mode === 'register' ? 'login' : 'register')
              }}
            >
              {mode === 'register' ? 'Iniciá sesión' : 'Registrate aquí'}
            </button>
          </div>
        </form>

        <div className="auth-security-badge">
          <ShieldCheck className="w-3.5 h-3.5" /> Conexión segura con cifrado SSL
        </div>
      </div>
    </div>
  )
}
