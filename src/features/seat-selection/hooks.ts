import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getSessionSeats, type Seat } from './api'

export const seatKeys = { list: (sessionId: string) => ['seats', sessionId] as const }

/** Mapa da sala com polling (~5s) para refletir ocupação feita por outros usuários. */
export const useSessionSeats = (sessionId: string) =>
  useQuery({
    queryKey: seatKeys.list(sessionId),
    queryFn: () => getSessionSeats(sessionId),
    refetchInterval: 5000,
  })

/** Seleção local; assentos que deixaram de estar disponíveis saem da seleção automaticamente. */
export function useSeatSelection(seats: Seat[] | undefined) {
  const [picked, setPicked] = useState<string[]>([])
  const [conflicts, setConflicts] = useState<string[]>([])

  const available = new Set(seats?.filter((s) => s.status === 'AVAILABLE').map((s) => s.code))
  const selected = picked.filter((c) => available.has(c))

  const toggle = (code: string) => {
    setConflicts([])
    setPicked(
      selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code].sort(),
    )
  }
  const markConflicts = (codes: string[]) => {
    setConflicts(codes)
    setPicked(selected.filter((c) => !codes.includes(c)))
  }

  return { selected, conflicts, toggle, markConflicts }
}
