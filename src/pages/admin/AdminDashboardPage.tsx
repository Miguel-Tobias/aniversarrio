import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  type GiftContributionRow,
  formatPaymentAmount,
  formatPaymentLogDate,
  giftTitleForId,
  paidContributionsToCsv,
  summarizePaidContributions,
} from '../../lib/giftPaymentLog'
import {
  effectiveRsvpRows,
  formatRsvpReportDate,
  type RsvpResponseRow,
  rsvpGuestNameKey,
  rsvpAttendingLabel,
  rsvpLastActivityAt,
  rsvpRowsToCsv,
  summarizeRsvpRows,
} from '../../lib/rsvpResponses'
import { getSupabaseBrowserClient } from '../../lib/supabaseClient'
import type { WeddingGiftRow, WeddingGuestRow } from '../../lib/weddingCatalog'
import { fetchWeddingGiftRows, formatCatalogDbError } from '../../lib/weddingCatalog'
import { SpreadsheetUpload } from '../../components/admin/SpreadsheetUpload'

function parsePrice(s: string): number | null {
  const t = s.trim().replace(',', '.')
  if (t === '') return null
  const n = Number(t)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100) / 100
}

function parseSort(s: string): number {
  const n = Number(s.trim())
  return Number.isFinite(n) ? Math.trunc(n) : 0
}

export function AdminDashboardPage() {
  const sb = getSupabaseBrowserClient()
  const navigate = useNavigate()
  const [gifts, setGifts] = useState<WeddingGiftRow[]>([])
  const [guests, setGuests] = useState<WeddingGuestRow[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [rsvpResponses, setRsvpResponses] = useState<RsvpResponseRow[]>([])
  const [rsvpLoadError, setRsvpLoadError] = useState<string | null>(null)
  const [paymentRows, setPaymentRows] = useState<GiftContributionRow[]>([])
  const [paymentLoadError, setPaymentLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [giftTitle, setGiftTitle] = useState('')
  const [giftDesc, setGiftDesc] = useState('')
  const [giftPrice, setGiftPrice] = useState('')
  const [giftSort, setGiftSort] = useState('0')
  const [giftEditingId, setGiftEditingId] = useState<string | null>(null)
  const [giftBusy, setGiftBusy] = useState(false)
  const [giftFormError, setGiftFormError] = useState<string | null>(null)

  const [guestName, setGuestName] = useState('')
  const [guestSort, setGuestSort] = useState('0')
  const [guestEditingId, setGuestEditingId] = useState<string | null>(null)
  const [guestBusy, setGuestBusy] = useState(false)
  const [guestFormError, setGuestFormError] = useState<string | null>(null)
  const [rsvpClearBusy, setRsvpClearBusy] = useState(false)

  const reload = useCallback(async () => {
    if (!sb) return
    setLoadError(null)
    setRsvpLoadError(null)
    setPaymentLoadError(null)
    setLoading(true)
    try {
      const [giftRows, gu] = await Promise.all([
        fetchWeddingGiftRows(sb),
        sb
          .from('wedding_invited_guests')
          .select('id,name,sort_order')
          .order('sort_order', { ascending: true })
          .order('id', { ascending: true }),
      ])
      if (gu.error) throw new Error(gu.error.message)
      setGifts(giftRows)
      setGuests((gu.data ?? []) as WeddingGuestRow[])

      const rv = await sb
        .from('rsvp_responses')
        .select(
          'id,guest_id,full_name,email,phone,attending,guest_count,dietary_notes,message,created_at,updated_at',
        )
        .order('updated_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (rv.error) {
        setRsvpLoadError(rv.error.message)
        setRsvpResponses([])
      } else {
        setRsvpResponses((rv.data ?? []) as RsvpResponseRow[])
      }

      const pay = await sb
        .from('gift_contributions')
        .select(
          'id,gift_id,amount,payment_status,provider_ref,paid_at,created_at',
        )
        .order('paid_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (pay.error) {
        setPaymentLoadError(pay.error.message)
        setPaymentRows([])
      } else {
        setPaymentRows((pay.data ?? []) as GiftContributionRow[])
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Não foi possível carregar.')
    } finally {
      setLoading(false)
    }
  }, [sb])

  useEffect(() => {
    void Promise.resolve().then(reload)
  }, [reload])

  const giftTitleMap = useMemo(
    () => new Map(gifts.map((g) => [g.id, g.title])),
    [gifts],
  )

  const paidPayments = useMemo(
    () => paymentRows.filter((r) => r.payment_status === 'paid'),
    [paymentRows],
  )

  const paymentSummary = summarizePaidContributions(paymentRows)

  const downloadPaymentCsv = () => {
    if (paidPayments.length === 0) return
    const csv = paidContributionsToCsv(paymentRows, giftTitleMap)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '').replace('T', '-')
    a.href = url
    a.download = `pagamentos-presentes-${stamp}.csv`
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const downloadRsvpCsv = () => {
    if (rsvpReportRows.length === 0) return
    const csv = rsvpRowsToCsv(rsvpResponses)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '').replace('T', '-')
    a.href = url
    a.download = `confirmacoes-presenca-${stamp}.csv`
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const logout = async () => {
    if (sb) await sb.auth.signOut()
    void navigate('/admin/login', { replace: true })
  }

  const resetGiftForm = () => {
    setGiftTitle('')
    setGiftDesc('')
    setGiftPrice('')
    setGiftSort('0')
    setGiftEditingId(null)
    setGiftFormError(null)
  }

  const startEditGift = (g: WeddingGiftRow) => {
    setGiftEditingId(g.id)
    setGiftTitle(g.title)
    setGiftDesc(g.description)
    setGiftPrice(String(g.price))
    setGiftSort(String(g.sort_order))
    setGiftFormError(null)
  }

  const saveGift = async (e: FormEvent) => {
    e.preventDefault()
    if (!sb) return
    setGiftFormError(null)
    const price = parsePrice(giftPrice)
    if (!giftTitle.trim()) {
      setGiftFormError('Informe o título do presente.')
      return
    }
    if (price === null) {
      setGiftFormError('Informe um preço válido (maior que zero).')
      return
    }
    const sort_order = parseSort(giftSort)
    setGiftBusy(true)
    try {
      if (giftEditingId) {
        const { error } = await sb
          .from('wedding_gifts')
          .update({
            title: giftTitle.trim(),
            description: giftDesc.trim(),
            price,
            sort_order,
            updated_at: new Date().toISOString(),
          })
          .eq('id', giftEditingId)
        if (error) throw new Error(error.message)
      } else {
        const id = crypto.randomUUID()
        const { error } = await sb.from('wedding_gifts').insert({
          id,
          title: giftTitle.trim(),
          description: giftDesc.trim(),
          price,
          sort_order,
        })
        if (error) throw new Error(error.message)
      }
      resetGiftForm()
      await reload()
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Não foi possível salvar.'
      setGiftFormError(formatCatalogDbError(raw))
    } finally {
      setGiftBusy(false)
    }
  }

  const deleteGift = async (id: string) => {
    if (!sb) return
    if (!window.confirm('Excluir este presente? Os valores já pagos no Supabase mantêm o gift_id.'))
      return
    const { error } = await sb.from('wedding_gifts').delete().eq('id', id)
    if (error) {
      window.alert(error.message)
      return
    }
    if (giftEditingId === id) resetGiftForm()
    await reload()
  }

  const resetGuestForm = () => {
    setGuestName('')
    setGuestSort('0')
    setGuestEditingId(null)
    setGuestFormError(null)
  }

  const startEditGuest = (g: WeddingGuestRow) => {
    setGuestEditingId(g.id)
    setGuestName(g.name)
    setGuestSort(String(g.sort_order))
    setGuestFormError(null)
  }

  const saveGuest = async (e: FormEvent) => {
    e.preventDefault()
    if (!sb) return
    setGuestFormError(null)
    if (!guestName.trim()) {
      setGuestFormError('Informe o nome do convidado.')
      return
    }
    const sort_order = parseSort(guestSort)
    setGuestBusy(true)
    try {
      if (guestEditingId) {
        const { error } = await sb
          .from('wedding_invited_guests')
          .update({
            name: guestName.trim(),
            sort_order,
            updated_at: new Date().toISOString(),
          })
          .eq('id', guestEditingId)
        if (error) throw new Error(error.message)
      } else {
        const id = crypto.randomUUID()
        const { error } = await sb.from('wedding_invited_guests').insert({
          id,
          name: guestName.trim(),
          sort_order,
        })
        if (error) throw new Error(error.message)
      }
      resetGuestForm()
      await reload()
    } catch (err) {
      setGuestFormError(
        err instanceof Error ? err.message : 'Não foi possível salvar.',
      )
    } finally {
      setGuestBusy(false)
    }
  }

  const deleteGuest = async (id: string) => {
    if (!sb) return
    if (!window.confirm('Remover este convidado da lista?')) return
    const { error } = await sb.from('wedding_invited_guests').delete().eq('id', id)
    if (error) {
      window.alert(error.message)
      return
    }
    if (guestEditingId === id) resetGuestForm()
    await reload()
  }

  const clearAllRsvpResponses = async () => {
    if (!sb || rsvpResponses.length === 0) return
    const total = rsvpResponses.length
    const ok = window.confirm(
      `Apagar todas as ${total} confirmação(ões) salvas no banco?\n\n` +
        'Isso limpa o relatório RSVP (incluindo dados de teste). A lista de convidados não é alterada — apenas as respostas são removidas.\n\n' +
        'Esta ação não pode ser desfeita.',
    )
    if (!ok) return
    if (
      !window.confirm(
        'Confirme novamente: deseja apagar todas as confirmações de presença?',
      )
    ) {
      return
    }

    setRsvpClearBusy(true)
    setRsvpLoadError(null)
    try {
      const { error } = await sb
        .from('rsvp_responses')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (error) {
        window.alert(
          `Não foi possível apagar as confirmações: ${error.message}\n\n` +
            'Se o erro mencionar permissão, execute no Supabase o arquivo supabase/migrations/009_admin_rsvp_delete.sql.',
        )
        return
      }
      await reload()
    } finally {
      setRsvpClearBusy(false)
    }
  }

  const rsvpSummary = summarizeRsvpRows(rsvpResponses)
  const rsvpReportRows = useMemo(
    () => effectiveRsvpRows(rsvpResponses),
    [rsvpResponses],
  )
  const rsvpByGuestId = useMemo(() => {
    const map = new Map<string, RsvpResponseRow>()
    for (const row of rsvpReportRows) {
      const id = row.guest_id?.trim()
      if (id) map.set(id, row)
    }
    return map
  }, [rsvpReportRows])
  const rsvpByGuestName = useMemo(() => {
    const map = new Map<string, RsvpResponseRow>()
    for (const row of rsvpReportRows) {
      map.set(rsvpGuestNameKey(row.full_name), row)
    }
    return map
  }, [rsvpReportRows])

  if (!sb) {
    return (
      <div className="admin-shell admin-panel">
        <p>Supabase não configurado.</p>
        <Link className="admin-link" to="/">
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <h1 className="admin-topbar__title">Administração</h1>
        <div className="admin-topbar__actions">
          <button type="button" className="admin-btn-ghost" onClick={() => void reload()}>
            Atualizar listas
          </button>
          <Link className="admin-btn-ghost admin-link-btn" to="/">
            Ver site
          </Link>
          <button type="button" className="admin-btn-ghost" onClick={() => void logout()}>
            Sair
          </button>
        </div>
      </header>

      {loadError ? (
        <div className="alert admin-alert" role="alert">
          {loadError}
        </div>
      ) : null}

      {loading ? (
        <p className="admin-muted">Carregando…</p>
      ) : (
        <>
          <section className="admin-section">
            <h2 className="admin-h2">Lista de presentes</h2>
            <p className="admin-section__hint">
              Valores fixos de presente (sem fotos). O identificador interno (id)
              não pode ser alterado — isso evita conflitos com o histórico de
              pagamentos.
            </p>

            {sb ? (
              <SpreadsheetUpload
                kind="gifts"
                sb={sb}
                existingIds={gifts.map((g) => g.id)}
                onDone={reload}
              />
            ) : null}

            <form className="admin-form admin-form--inline" onSubmit={saveGift}>
              <h3 className="admin-h3">
                {giftEditingId ? 'Editar presente' : 'Novo presente'}
              </h3>
              {giftFormError ? (
                <div className="alert" role="alert">
                  {giftFormError}
                </div>
              ) : null}
              {giftEditingId ? (
                <p className="admin-muted">
                  <strong>Id:</strong> <code className="inline-code">{giftEditingId}</code>
                </p>
              ) : null}
              <label className="admin-label" htmlFor="g-title">
                Título
              </label>
              <input
                id="g-title"
                className="admin-input"
                value={giftTitle}
                onChange={(e) => setGiftTitle(e.target.value)}
              />
              <label className="admin-label" htmlFor="g-desc">
                Descrição
              </label>
              <textarea
                id="g-desc"
                className="admin-textarea"
                rows={2}
                value={giftDesc}
                onChange={(e) => setGiftDesc(e.target.value)}
              />
              <div className="admin-form-row">
                <div>
                  <label className="admin-label" htmlFor="g-price">
                    Preço (R$)
                  </label>
                  <input
                    id="g-price"
                    className="admin-input"
                    inputMode="decimal"
                    value={giftPrice}
                    onChange={(e) => setGiftPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="admin-label" htmlFor="g-sort">
                    Ordem
                  </label>
                  <input
                    id="g-sort"
                    className="admin-input admin-input--narrow"
                    inputMode="numeric"
                    value={giftSort}
                    onChange={(e) => setGiftSort(e.target.value)}
                  />
                </div>
              </div>
              <div className="admin-form-actions">
                <button type="submit" className="admin-btn-primary" disabled={giftBusy}>
                  {giftBusy ? 'Salvando…' : giftEditingId ? 'Salvar alterações' : 'Adicionar presente'}
                </button>
                {giftEditingId || giftTitle || giftDesc || giftPrice ? (
                  <button
                    type="button"
                    className="admin-btn-ghost"
                    onClick={resetGiftForm}
                  >
                    Limpar
                  </button>
                ) : null}
              </div>
            </form>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ordem</th>
                  <th>Título</th>
                  <th>Preço</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {gifts.map((g) => (
                  <tr key={g.id}>
                    <td>{g.sort_order}</td>
                    <td>
                      <strong>{g.title}</strong>
                      <div className="admin-table__sub">{g.description}</div>
                    </td>
                    <td>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(Number(g.price))}
                    </td>
                    <td className="admin-table__actions">
                      <button
                        type="button"
                        className="admin-btn-small"
                        onClick={() => startEditGift(g)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="admin-btn-small admin-btn-small--danger"
                        onClick={() => void deleteGift(g.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {gifts.length === 0 ? (
              <p className="admin-muted">Ainda não há presentes cadastrados.</p>
            ) : null}
          </section>

          <section className="admin-section">
            <h2 className="admin-h2">Registro de pagamentos (PIX)</h2>
            <p className="admin-section__hint">
              Pagamentos confirmados pelo Mercado Pago. O PIX não identifica o
              convidado pelo nome — aqui ficam registrados <strong>qual presente</strong>,{' '}
              <strong>quanto</strong> e <strong>quando</strong> foi pago.
            </p>

            {paymentLoadError ? (
              <div className="alert admin-alert" role="alert">
                <strong>Não foi possível carregar o registro de pagamentos:</strong>{' '}
                {paymentLoadError}
                <p className="admin-muted admin-rsvp-migration-note">
                  Execute no Supabase SQL Editor o arquivo{' '}
                  <code className="inline-code">
                    supabase/migrations/007_admin_gift_contributions_read.sql
                  </code>
                  .
                </p>
              </div>
            ) : (
              <>
                <div className="admin-rsvp-summary" aria-live="polite">
                  <span>
                    <strong>{paymentSummary.paidCount}</strong> pagamento(s)
                    confirmado(s)
                  </span>
                  <span className="admin-rsvp-summary__yes">
                    Total recebido:{' '}
                    <strong>{formatPaymentAmount(paymentSummary.totalAmount)}</strong>
                  </span>
                  {paymentSummary.pendingCount > 0 ? (
                    <span className="admin-rsvp-summary__muted">
                      <strong>{paymentSummary.pendingCount}</strong> cobrança(s)
                      pendente(s) (QR gerado, ainda não pago)
                    </span>
                  ) : null}
                </div>
                <div className="admin-form-actions admin-rsvp-actions">
                  <button
                    type="button"
                    className="admin-btn-primary"
                    onClick={() => downloadPaymentCsv()}
                    disabled={paidPayments.length === 0}
                  >
                    Baixar CSV (Excel)
                  </button>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Data do pagamento</th>
                        <th>Presente</th>
                        <th>Valor</th>
                        <th>Ref. MP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paidPayments.map((row) => (
                        <tr key={row.id}>
                          <td>{formatPaymentLogDate(row.paid_at)}</td>
                          <td>
                            <strong>
                              {giftTitleForId(row.gift_id, giftTitleMap)}
                            </strong>
                          </td>
                          <td>{formatPaymentAmount(Number(row.amount))}</td>
                          <td
                            className="admin-table__cell-clip"
                            title={row.provider_ref ?? ''}
                          >
                            {row.provider_ref ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {paidPayments.length === 0 ? (
                  <p className="admin-muted">
                    Ainda não há pagamentos confirmados registrados.
                  </p>
                ) : null}
              </>
            )}
          </section>

          <section className="admin-section">
            <h2 className="admin-h2">Lista de convidados (RSVP)</h2>
            <p className="admin-section__hint">
              Nomes que aparecem na página de confirmação. A coluna «Resposta» mostra
              a última confirmação recebida (detalhes completos no relatório abaixo).
            </p>

            {sb ? (
              <SpreadsheetUpload
                kind="guests"
                sb={sb}
                existingIds={guests.map((g) => g.id)}
                onDone={reload}
              />
            ) : null}

            <form className="admin-form admin-form--inline" onSubmit={saveGuest}>
              <h3 className="admin-h3">
                {guestEditingId ? 'Editar convidado' : 'Novo convidado'}
              </h3>
              {guestFormError ? (
                <div className="alert" role="alert">
                  {guestFormError}
                </div>
              ) : null}
              {guestEditingId ? (
                <p className="admin-muted">
                  <strong>Id:</strong> <code className="inline-code">{guestEditingId}</code>
                </p>
              ) : null}
              <label className="admin-label" htmlFor="v-name">
                Nome (como no convite)
              </label>
              <input
                id="v-name"
                className="admin-input"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
              <label className="admin-label" htmlFor="v-sort">
                Ordem
              </label>
              <input
                id="v-sort"
                className="admin-input admin-input--narrow"
                inputMode="numeric"
                value={guestSort}
                onChange={(e) => setGuestSort(e.target.value)}
              />
              <div className="admin-form-actions">
                <button type="submit" className="admin-btn-primary" disabled={guestBusy}>
                  {guestBusy ? 'Salvando…' : guestEditingId ? 'Salvar' : 'Adicionar'}
                </button>
                {guestEditingId || guestName ? (
                  <button
                    type="button"
                    className="admin-btn-ghost"
                    onClick={resetGuestForm}
                  >
                    Limpar
                  </button>
                ) : null}
              </div>
            </form>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ordem</th>
                  <th>Nome</th>
                  <th>Resposta</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((g) => {
                  const rsvp =
                    rsvpByGuestId.get(g.id) ??
                    rsvpByGuestName.get(rsvpGuestNameKey(g.name))
                  return (
                  <tr key={g.id}>
                    <td>{g.sort_order}</td>
                    <td>{g.name}</td>
                    <td>
                      {rsvp ? (
                        <span
                          className={
                            rsvp.attending === 'yes'
                              ? 'admin-rsvp-badge admin-rsvp-badge--yes'
                              : rsvp.attending === 'no'
                                ? 'admin-rsvp-badge admin-rsvp-badge--no'
                                : 'admin-rsvp-badge'
                          }
                        >
                          {rsvpAttendingLabel(rsvp.attending)}
                        </span>
                      ) : (
                        <span className="admin-muted">Pendente</span>
                      )}
                    </td>
                    <td className="admin-table__actions">
                      <button
                        type="button"
                        className="admin-btn-small"
                        onClick={() => startEditGuest(g)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="admin-btn-small admin-btn-small--danger"
                        onClick={() => void deleteGuest(g.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
            {guests.length === 0 ? (
              <p className="admin-muted">Ainda não há convidados cadastrados.</p>
            ) : null}
          </section>

          <section className="admin-section">
            <h2 className="admin-h2">Relatório de confirmações (RSVP)</h2>
            <p className="admin-section__hint">
              Uma linha por convidado, com a <strong>última resposta</strong>{' '}
              registrada (alterações não geram duplicatas). Ordenado da mais
              recente para a mais antiga.
            </p>

            {rsvpLoadError ? (
              <div className="alert admin-alert" role="alert">
                <strong>Não foi possível carregar as confirmações:</strong> {rsvpLoadError}
                <p className="admin-muted admin-rsvp-migration-note">
                  Se o erro mencionar permissões ou política RLS, execute no Supabase
                  SQL Editor o arquivo{' '}
                  <code className="inline-code">supabase/migrations/006_rsvp_policies_fix.sql</code>.
                </p>
              </div>
            ) : (
              <>
                <div className="admin-rsvp-summary" aria-live="polite">
                  <span>
                    <strong>{rsvpSummary.total}</strong> convidado(s) com resposta
                  </span>
                  <span className="admin-rsvp-summary__yes">
                    <strong>{rsvpSummary.yes}</strong> sim
                  </span>
                  <span className="admin-rsvp-summary__no">
                    <strong>{rsvpSummary.no}</strong> não
                  </span>
                  <span>
                    <strong>{rsvpSummary.maybe}</strong> talvez
                  </span>
                  <span className="admin-rsvp-summary__muted">
                    Lugares (respostas “sim”): <strong>{rsvpSummary.headsConfirmed}</strong>
                  </span>
                </div>
                <div className="admin-form-actions admin-rsvp-actions">
                  <button
                    type="button"
                    className="admin-btn-primary"
                    onClick={() => downloadRsvpCsv()}
                    disabled={rsvpReportRows.length === 0}
                  >
                    Baixar CSV (Excel)
                  </button>
                  <button
                    type="button"
                    className="admin-btn-small admin-btn-small--danger"
                    disabled={rsvpResponses.length === 0 || rsvpClearBusy}
                    onClick={() => void clearAllRsvpResponses()}
                  >
                    {rsvpClearBusy ? 'Apagando…' : 'Limpar todas as confirmações'}
                  </button>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Data do registro</th>
                        <th>Nome</th>
                        <th>Presença</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rsvpReportRows.map((r) => (
                        <tr key={r.id}>
                          <td>{formatRsvpReportDate(rsvpLastActivityAt(r))}</td>
                          <td>
                            <strong>{r.full_name}</strong>
                          </td>
                          <td>{rsvpAttendingLabel(r.attending)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rsvpReportRows.length === 0 ? (
                  <p className="admin-muted">Ainda não há confirmações registradas.</p>
                ) : null}
              </>
            )}
          </section>
        </>
      )}
    </div>
  )
}
