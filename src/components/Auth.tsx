import { FormEvent, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Mail, Lock, UserRound, Eye, EyeClosed, ArrowRight, ChevronLeft, Loader2 } from 'lucide-react'
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
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | 'name' | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  // 3D Tilt Card Effects
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10])
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10])

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left - rect.width / 2)
    mouseY.set(e.clientY - rect.top - rect.height / 2)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

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

    setMessage(
      error
        ? error.message
        : mode === 'reset'
          ? 'Revisá tu correo para continuar.'
          : mode === 'register'
            ? 'Cuenta creada. Revisá tu correo para confirmar tu email.'
            : '',
    )
    setBusy(false)
  }

  return (
    <div className="auth-custom-wrapper">
      {/* Dynamic Ambient Background */}
      <div className="auth-bg-gradient" />
      <div className="auth-bg-noise" />

      {/* Glow Orbs */}
      <div className="auth-glow-top" />
      <motion.div
        className="auth-glow-pulse-top"
        animate={{ opacity: [0.2, 0.4, 0.2], scale: [0.98, 1.03, 0.98] }}
        transition={{ duration: 7, repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.div
        className="auth-glow-pulse-bottom"
        animate={{ opacity: [0.25, 0.45, 0.25], scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, repeatType: "mirror", delay: 1 }}
      />

      {/* Main 3D Container */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="auth-card-container"
        style={{ perspective: 1500 }}
      >
        <motion.div
          className="auth-tilt-wrapper"
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileHover={{ z: 12 }}
        >
          <div className="auth-card-group">
            {/* Animated Traveling Light Beams */}
            <div className="auth-light-beams">
              <motion.div
                className="beam-top"
                animate={{ left: ["-50%", "100%"], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
              />
              <motion.div
                className="beam-right"
                animate={{ top: ["-50%", "100%"], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 0.6 }}
              />
              <motion.div
                className="beam-bottom"
                animate={{ right: ["-50%", "100%"], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.2 }}
              />
              <motion.div
                className="beam-left"
                animate={{ bottom: ["-50%", "100%"], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.8 }}
              />
            </div>

            {/* Glass Card */}
            <div className="auth-glass-card">
              {/* Header / Brand */}
              <div className="auth-header">
                {mode === 'reset' && (
                  <button type="button" className="auth-back-btn" onClick={() => setMode('login')}>
                    <ChevronLeft className="w-4 h-4" /> Volver
                  </button>
                )}

                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.7 }}
                  className="auth-brand-logo"
                >
                  <img src="/brand/jcb-wordmark.png" alt="JCB Developement" className="auth-logo-img" />
                </motion.div>

                <motion.h1
                  key={`title-${mode}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {mode === 'login' ? 'Bienvenido' : mode === 'register' ? 'Crear cuenta' : 'Recuperar acceso'}
                </motion.h1>

                <motion.p
                  key={`desc-${mode}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  {mode === 'login'
                    ? 'Ingresá para administrar tu negocio.'
                    : mode === 'register'
                      ? 'Empezá a controlar tus finanzas.'
                      : 'Te enviaremos un enlace de recuperación.'}
                </motion.p>
              </div>

              {/* Form */}
              <form onSubmit={submit} className="auth-form-space">
                {mode === 'register' && (
                  <div className={`auth-input-group ${focusedInput === 'name' ? 'focused' : ''}`}>
                    <UserRound className={`auth-input-icon ${focusedInput === 'name' ? 'active' : ''}`} />
                    <input
                      required
                      type="text"
                      placeholder="Tu nombre"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setFocusedInput('name')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </div>
                )}

                <div className={`auth-input-group ${focusedInput === 'email' ? 'focused' : ''}`}>
                  <Mail className={`auth-input-icon ${focusedInput === 'email' ? 'active' : ''}`} />
                  <input
                    required
                    type="email"
                    placeholder="nombre@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </div>

                {mode !== 'reset' && (
                  <div className={`auth-input-group ${focusedInput === 'password' ? 'focused' : ''}`}>
                    <Lock className={`auth-input-icon ${focusedInput === 'password' ? 'active' : ''}`} />
                    <input
                      required
                      minLength={6}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Contraseña (mín. 6 caracteres)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedInput('password')}
                      onBlur={() => setFocusedInput(null)}
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

                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="auth-feedback-msg"
                  >
                    {message}
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={busy}
                  className="auth-primary-btn"
                >
                  <AnimatePresence mode="wait">
                    {busy ? (
                      <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Loader2 className="w-4 h-4 spin inline" />
                      </motion.span>
                    ) : (
                      <motion.span key="btn-text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-center">
                        {mode === 'login' ? 'Ingresar' : mode === 'register' ? 'Registrarme' : 'Enviar enlace'}
                        <ArrowRight className="w-4 h-4 ml-1.5 inline" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Sub-links */}
                {mode === 'login' && (
                  <button type="button" className="auth-forgot-link" onClick={() => setMode('reset')}>
                    ¿Olvidaste tu contraseña?
                  </button>
                )}

                <div className="auth-switch-footer">
                  {mode === 'register' ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}
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
        </motion.div>
      </motion.div>
    </div>
  )
}
