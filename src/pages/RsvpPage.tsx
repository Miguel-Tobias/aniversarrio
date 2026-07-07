import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { EventNameLogo } from '../components/EventNameLogo'
import { FlamengoPattern } from '../components/FlamengoPattern'
import { type InvitedGuest, event } from '../config'
import { usePublicInvitedGuests } from '../hooks/usePublicInvitedGuests'
import { rsvpAttendingLabel } from '../lib/rsvpResponses'
import {
  fetchRsvpForGuest,
  formatRsvpForMessage,
  submitRsvpToSupabase,
  type RsvpPayload,
} from '../lib/submitRsvp'
import { supabaseConfigured } from '../lib/supabaseClient'

function normalizeForSearch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

export function RsvpPage() {
  const { guests: invitedGuests, loading: guestsLoading, error: guestsError } =
    usePublicInvitedGuests()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<InvitedGuest | null>(null)
  const [attending, setAttending] = useState<'yes' | 'no' | null>(null)
  const [existingAttending, setExistingAttending] = useState<
    'yes' | 'no' | null
  >(null)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [wasUpdate, setWasUpdate] = useState(false)
  const [lastAttending, setLastAttending] = useState<'yes' | 'no' | null>(null)
  const [copiedLocal, setCopiedLocal] = useState(false)

  const remote = supabaseConfigured()

  const qNorm = normalizeForSearch(query)
  const matches = useMemo(() => {
    if (qNorm.length < 2) return []
    return invitedGuests.filter((g) =>
      normalizeForSearch(g.name).includes(qNorm),
    )
  }, [qNorm, invitedGuests])

  const canSubmit = Boolean(selected && attending !== null)

  useEffect(() => {
    if (!remote || !selected) {
      setExistingAttending(null)
      setLoadingExisting(false)
      return
    }

    let cancelled = false
    setLoadingExisting(true)
    setExistingAttending(null)

    void fetchRsvpForGuest(selected.id).then((existing) => {
      if (cancelled) return
      if (existing) {
        setExistingAttending(existing.attending)
        setAttending(existing.attending)
      } else {
        setExistingAttending(null)
        setAttending(null)
      }
      setLoadingExisting(false)
    })

    return () => {
      cancelled = true
    }
  }, [remote, selected])

  const onPickGuest = (guest: InvitedGuest) => {
    setSelected(guest)
    setAttending(null)
    setExistingAttending(null)
    setError(null)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!selected || attending === null) {
      setError('Escolha seu nome na lista e informe se você vai comparecer.')
      return
    }

    const payload: RsvpPayload = {
      guest_id: selected.id,
      full_name: selected.name,
      attending,
      guest_count: attending === 'yes' ? 1 : 0,
    }

    setBusy(true)
    try {
      if (remote) {
        const res = await submitRsvpToSupabase(payload)
        if (!res.ok) {
          setError(
            'Não foi possível registrar sua resposta. Tente novamente em instantes.',
          )
          return
        }
        setWasUpdate(res.updated)
        setLastAttending(attending)
      } else {
        const text = formatRsvpForMessage(payload, event.names)
        await navigator.clipboard.writeText(text)
        setCopiedLocal(true)
        window.setTimeout(() => setCopiedLocal(false), 2400)
        setWasUpdate(false)
        setLastAttending(attending)
      }
      setDone(true)
      setQuery('')
      setSelected(null)
      setAttending(null)
      setExistingAttending(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? 'Não foi possível enviar sua resposta. Verifique sua conexão e tente novamente.'
          : 'Não foi possível enviar. Tente novamente.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <header className="page-hero" aria-label="Confirmar presença">
        <FlamengoPattern tone="dark" />
        <div className="page-hero__inner">
          <div className="page-hero__eyebrow page-hero__eyebrow--logo">
            <EventNameLogo variant="banner" />
          </div>
          <h1 className="page-hero__title">Confirmar presença</h1>
          <p className="page-hero__lead">
            Procure seu nome na lista e nos diga se você vem à celebração. Dia{' '}
            {event.date} — {event.timeDetail}. Se marcar por engano, você
            pode voltar aqui depois para{' '}
            <strong>alterar sua resposta</strong>.
          </p>
        </div>
      </header>

      <main id="conteudo" className="main rsvp-main">
        {done ? (
          <div className="rsvp-success rsvp-success--in" role="status">
            <div className="rsvp-success__icon" aria-hidden>
              {wasUpdate ? '✨' : lastAttending === 'yes' ? '🎉' : '💌'}
            </div>
            <h2 className="rsvp-success__title">
              {remote
                ? wasUpdate
                  ? 'Resposta atualizada ✨'
                  : lastAttending === 'yes'
                    ? 'Presença confirmada! 🎉'
                    : 'Resposta registrada'
                : 'Obrigado!'}
            </h2>
            <p className="rsvp-success__text">
              {remote
                ? wasUpdate
                  ? 'Sua resposta foi atualizada com sucesso. Obrigado por ajudar na organização da festa.'
                  : lastAttending === 'yes'
                    ? 'Ficamos muito felizes em celebrar com você. Mal podemos esperar para te ver no Studio Pub!'
                    : 'Recebemos sua resposta. Se seus planos mudarem, volte aqui e procure o mesmo nome para atualizar.'
                : 'Copiamos o texto da confirmação. Cole em uma mensagem para o Miguel.'}
            </p>
            {copiedLocal ? (
              <p className="rsvp-success__copied">Texto copiado.</p>
            ) : null}
            <button
              type="button"
              className="rsvp-success__again"
              onClick={() => {
                setDone(false)
                setWasUpdate(false)
                setLastAttending(null)
                setError(null)
              }}
            >
              {remote ? 'Alterar ou confirmar outra pessoa' : 'Confirmar outra resposta'}
            </button>
          </div>
        ) : guestsLoading ? (
          <p className="rsvp-hint rsvp-hint--loading" role="status">
            <span className="ui-spinner" aria-hidden />
            Carregando a lista de convidados…
          </p>
        ) : (
          <form className="rsvp-form" onSubmit={onSubmit} noValidate>
            {guestsError ? (
              <div className="alert" role="alert">
                Não foi possível carregar a lista de convidados. Estamos
                exibindo a lista local de reserva.
              </div>
            ) : null}
            {invitedGuests.length === 0 ? (
              <p className="rsvp-hint rsvp-hint--warn" role="status">
                A lista de convidados ainda não está disponível. Entre em contato
                com quem organiza a festa.
              </p>
            ) : null}

            {!remote ? (
              <p className="rsvp-form__notice" role="note">
                Ao confirmar, o texto será copiado para você enviar uma mensagem
                para o Miguel.
              </p>
            ) : (
              <p className="rsvp-form__notice" role="note">
                Cada confirmação nos ajuda a preparar tudo com muito carinho.
                Procure seu nome na lista — sua resposta fica salva com segurança
                e pode ser alterada a qualquer momento.
              </p>
            )}

            {error ? (
              <div className="alert" role="alert">
                {error}
              </div>
            ) : null}

            <div className="rsvp-field">
              <label className="rsvp-label" htmlFor="rsvp-search">
                Seu nome na lista de convidados
              </label>
              <input
                id="rsvp-search"
                className="rsvp-input"
                type="search"
                autoComplete="off"
                placeholder="Digite pelo menos 2 letras para buscar"
                value={query}
                onChange={(e) => {
                  const next = e.target.value
                  setQuery(next)
                  setError(null)
                  const n = normalizeForSearch(next)
                  if (n.length < 2) {
                    setSelected(null)
                    setAttending(null)
                    setExistingAttending(null)
                    return
                  }
                  if (selected) {
                    const g = invitedGuests.find((x) => x.id === selected.id)
                    const visible =
                      g !== undefined &&
                      normalizeForSearch(g.name).includes(n)
                    if (!visible) {
                      setSelected(null)
                      setAttending(null)
                      setExistingAttending(null)
                    }
                  }
                }}
              />
            </div>

            {qNorm.length >= 2 && matches.length === 0 ? (
              <p className="rsvp-hint rsvp-hint--warn" role="status">
                Não encontramos esse nome na lista. Tente outra grafia ou entre
                em contato com quem organiza a festa.
              </p>
            ) : null}

            {matches.length > 0 ? (
              <div className="rsvp-guest-block">
                <ul className="rsvp-guest-list" role="listbox" aria-label="Convidados">
                  {matches.map((g) => {
                    const active = selected?.id === g.id
                    return (
                      <li key={g.id}>
                        <button
                          type="button"
                          className={`rsvp-guest-item${active ? ' rsvp-guest-item--active' : ''}`}
                          role="option"
                          aria-selected={active}
                          onClick={() => onPickGuest(g)}
                        >
                          {g.name}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : qNorm.length >= 2 ? null : (
              <p className="rsvp-hint">
                Escreva pelo menos duas letras para ver os nomes da lista.
              </p>
            )}

            {selected ? (
              <div className="rsvp-picked">
                <p className="rsvp-picked__label">A confirmar para</p>
                <p className="rsvp-picked__name">{selected.name}</p>
                {remote && loadingExisting ? (
                  <p className="rsvp-hint rsvp-hint--loading" role="status">
                    <span className="ui-spinner" aria-hidden />
                    Verificando resposta anterior…
                  </p>
                ) : null}
                {remote && !loadingExisting && existingAttending !== null ? (
                  <p className="rsvp-picked__current" role="status">
                    Resposta atual:{' '}
                    <strong>{rsvpAttendingLabel(existingAttending)}</strong>.
                    Escolha abaixo para alterar, se quiser.
                  </p>
                ) : null}
                <fieldset className="rsvp-fieldset rsvp-fieldset--inline">
                  <legend className="rsvp-label">Vai comparecer?</legend>
                  <div className="rsvp-choice-row">
                    <button
                      type="button"
                      className={`rsvp-choice${attending === 'yes' ? ' rsvp-choice--on' : ''}`}
                      onClick={() => {
                        setAttending('yes')
                        setError(null)
                      }}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      className={`rsvp-choice${attending === 'no' ? ' rsvp-choice--on' : ''}`}
                      onClick={() => {
                        setAttending('no')
                        setError(null)
                      }}
                    >
                      Não
                    </button>
                  </div>
                </fieldset>
              </div>
            ) : null}

            <button
              type="submit"
              className="rsvp-submit"
              disabled={busy || !canSubmit || loadingExisting}
            >
              {busy
                ? 'Enviando…'
                : remote
                  ? existingAttending !== null
                    ? 'Atualizar confirmação'
                    : 'Enviar confirmação'
                  : 'Gerar texto e copiar'}
            </button>
          </form>
        )}
      </main>

      <footer className="footer">
        <p>Com carinho, {event.names}</p>
      </footer>
    </>
  )
}
