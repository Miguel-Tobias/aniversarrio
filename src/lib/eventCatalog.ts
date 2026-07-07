import type { InvitedGuest } from '../config'
import { getSupabaseBrowserClient } from './supabaseClient'

export type InvitedGuestRow = {
  id: string
  name: string
  sort_order: number
}

function rowToGuest(r: InvitedGuestRow): InvitedGuest {
  return { id: r.id, name: r.name }
}

export function formatCatalogDbError(message: string): string {
  return message
}

export async function fetchInvitedGuestsFromSupabase(): Promise<
  InvitedGuest[] | null
> {
  const sb = getSupabaseBrowserClient()
  if (!sb) return null
  const { data, error } = await sb
    .from('wedding_invited_guests')
    .select('id,name,sort_order')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as InvitedGuestRow[]).map(rowToGuest)
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const sb = getSupabaseBrowserClient()
  if (!sb) return false
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return false
  const { data, error } = await sb
    .from('app_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) return false
  return Boolean(data)
}
