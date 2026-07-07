import { useCallback, useEffect, useState } from 'react'
import {
  invitedGuests as fallbackGuests,
  type InvitedGuest,
} from '../config'
import { fetchInvitedGuestsFromSupabase } from '../lib/eventCatalog'
import { supabaseConfigured } from '../lib/supabaseClient'

export function usePublicInvitedGuests() {
  const [guests, setGuests] = useState<InvitedGuest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'supabase' | 'fallback'>('fallback')

  const refresh = useCallback(async () => {
    if (!supabaseConfigured()) {
      setGuests(fallbackGuests)
      setSource('fallback')
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const remote = await fetchInvitedGuestsFromSupabase()
      if (remote === null) {
        setGuests(fallbackGuests)
        setSource('fallback')
      } else {
        setGuests(remote)
        setSource('supabase')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar convidados.')
      setGuests(fallbackGuests)
      setSource('fallback')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(refresh)
  }, [refresh])

  return { guests, loading, error, source, refresh }
}
