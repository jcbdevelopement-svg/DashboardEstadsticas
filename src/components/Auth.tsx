import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabase'

export function Auth({ onBypass }: { onBypass?: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    let error

    try {
      if (mode === 'login') {
        ;({ error } = await supabase.auth.signInWithPassword({ email, password }))
      } else {
        ;({ error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        }))
      }

      if (error) {
        setMessage(error.message)
      } else if (mode === 'register') {
        setMessage('Cuenta creada con éxito.')
      }
    } catch (err: any) {
      setMessage(err?.message || 'Error al conectar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-basic-container">
      <div className="auth-basic-box">
        <div className="auth-basic-logo">
          <img src="/brand/jcb-wordmark.png" alt="JCB" />
        </div>

        <h2>{mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>

        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="auth-basic-group">
              <label>Nombre</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
              />
            </div>
          )}

          <div className="auth-basic-group">
            <label>Correo</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>

          <div className="auth-basic-group">
            <label>Contraseña</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {message && <div className="auth-basic-error">{message}</div>}

          <button type="submit" disabled={busy} className="auth-basic-btn">
            {busy ? 'Cargando...' : mode === 'login' ? 'Ingresar' : 'Registrarse'}
          </button>

          {onBypass && (
            <button
              type="button"
              className="auth-basic-btn-secondary"
              onClick={onBypass}
            >
              Entrar directo al panel
            </button>
          )}

          <div className="auth-basic-switch">
            <button
              type="button"
              onClick={() => {
                setMessage('')
                setMode(mode === 'login' ? 'register' : 'login')
              }}
            >
              {mode === 'login' ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Iniciá sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
