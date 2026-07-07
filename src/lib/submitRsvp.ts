import { getSupabaseBrowserClient } from './supabaseClient'

export type RsvpPayload = {
  guest_id: string
  full_name: string
  attending: 'yes' | 'no'
  /** Para convidados da lista: 1 pessoa confirma; sim = 1, não = 0. */
  guest_count: number
}

export type RsvpExisting = {
  attending: 'yes' | 'no'
}

export type RsvpSubmitResult =
  | { ok: true; mode: 'supabase'; updated: boolean }
  | { ok: false; message: string }

export async function fetchRsvpForGuest(
  guestId: string,
): Promise<RsvpExisting | null> {
  const sb = getSupabaseBrowserClient()
  if (!sb) return null

  const { data, error } = await sb
    .from('rsvp_responses')
    .select('attending')
    .eq('guest_id', guestId)
    .maybeSingle()

  if (error || !data) return null
  const attending = data.attending
  if (attending !== 'yes' && attending !== 'no') return null
  return { attending }
}

export async function submitRsvpToSupabase(
  payload: RsvpPayload,
): Promise<RsvpSubmitResult> {
  const sb = getSupabaseBrowserClient()
  if (!sb) {
    return {
      ok: false,
      message:
        'Supabase não está configurado no site. Corra o SQL em supabase/migrations/002_rsvp_responses.sql e defina VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, ou confirme a presença por mensagem direta aos noivos.',
    }
  }

  const guestId = payload.guest_id.trim()
  if (!guestId) {
    return { ok: false, message: 'Convidado inválido.' }
  }

  const row = {
    guest_id: guestId,
    full_name: payload.full_name.trim(),
    email: null,
    phone: null,
    attending: payload.attending,
    guest_count: payload.guest_count,
    dietary_notes: null,
    message: null,
    updated_at: new Date().toISOString(),
  }

  const { data: existing, error: readErr } = await sb
    .from('rsvp_responses')
    .select('id')
    .eq('guest_id', guestId)
    .maybeSingle()

  if (readErr) {
    return { ok: false, message: readErr.message }
  }

  if (existing) {
    const { error } = await sb
      .from('rsvp_responses')
      .update({
        full_name: row.full_name,
        attending: row.attending,
        guest_count: row.guest_count,
        updated_at: row.updated_at,
      })
      .eq('guest_id', guestId)

    if (error) {
      return { ok: false, message: error.message }
    }

    return { ok: true, mode: 'supabase', updated: true }
  }

  const { error } = await sb.from('rsvp_responses').insert(row)

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true, mode: 'supabase', updated: false }
}

export function formatRsvpForMessage(
  payload: RsvpPayload,
  names: string,
): string {
  const attendingLabel =
    payload.attending === 'yes' ? 'Vou comparecer' : 'Não vou comparecer'
  return [
    `Confirmação de presença — ${names}`,
    `Nome na lista: ${payload.full_name.trim()}`,
    `Resposta: ${attendingLabel}`,
  ].join('\n')
}
