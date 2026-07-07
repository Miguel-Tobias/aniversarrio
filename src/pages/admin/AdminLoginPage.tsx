import { type FormEvent, useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { getSupabaseBrowserClient } from '../../lib/supabaseClient'
import { isCurrentUserAdmin } from '../../lib/eventCatalog'

export function AdminLoginPage() {
  const sb = getSupabaseBrowserClient()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [redirect, setRedirect] = useState(false)

  useEffect(() => {
    if (!sb) return
    let cancelled = false
    ;(async () => {
      const {
        data: { session },
      } = await sb.auth.getSession()
      if (!session || cancelled) return
      if (await isCurrentUserAdmin()) {
        setRedirect(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sb])

  if (redirect) {
    return <Navigate to={from} replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!sb) {
      setError('Não foi possível entrar. Tente novamente mais tarde.')
      return
    }
    setBusy(true)
    try {
      const { error: signErr } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signErr) {
        setError(signErr.message)
        return
      }
      const admin = await isCurrentUserAdmin()
      if (!admin) {
        await sb.auth.signOut()
        setError('Esta conta não tem permissão para acessar o painel.')
        return
      }
      setRedirect(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-shell">
      <div className="admin-panel admin-panel--narrow">
        <h1 className="admin-h1">Área de administração</h1>
        <p className="admin-lead">
          Entre com seu e-mail e senha para gerenciar convidados e confirmações.
        </p>
        <form className="admin-form" onSubmit={onSubmit}>
          {error ? (
            <div className="alert" role="alert">
              {error}
            </div>
          ) : null}
          <label className="admin-label" htmlFor="admin-email">
            E-mail
          </label>
          <input
            id="admin-email"
            className="admin-input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label className="admin-label" htmlFor="admin-password">
            Senha
          </label>
          <input
            id="admin-password"
            className="admin-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="admin-btn-primary" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <p className="admin-foot">
          <Link className="admin-link" to="/">
            ← Voltar ao site público
          </Link>
        </p>
      </div>
    </div>
  )
}
