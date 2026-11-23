import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { bookingApi, isTerminalStatus, type Booking, type PaymentMethod } from './api'

export const bookingKeys = { detail: (id: string) => ['bookings', id] as const }

export function useBooking(id: string, refetchInterval: number | false = false) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => bookingApi.get(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && isTerminalStatus(status) ? false : refetchInterval
    },
  })
}

export function useHoldSeats() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: bookingApi.create,
    onSuccess: (booking) => qc.setQueryData(bookingKeys.detail(booking.id), booking),
  })
}

export function usePayBooking(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (method: PaymentMethod) => bookingApi.pay(id, method),
    onSuccess: () =>
      qc.setQueryData<Booking>(bookingKeys.detail(id), (old) =>
        old ? { ...old, status: 'PAYMENT_PENDING' } : old,
      ),
  })
}

export function useCancelBooking(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => bookingApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: bookingKeys.detail(id) }),
  })
}

/** Acompanha o pagamento assíncrono: polling até status terminal, com limite de tempo e retry. */
export function useBookingStatus(id: string, { interval = 2000, timeoutMs = 60_000 } = {}) {
  const [attempt, setAttempt] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const query = useBooking(id, timedOut ? false : interval)
  const status = query.data?.status
  const done = status ? isTerminalStatus(status) : false

  useEffect(() => {
    if (done) return
    const t = setTimeout(() => setTimedOut(true), timeoutMs)
    return () => clearTimeout(t)
  }, [attempt, done, timeoutMs])

  return {
    booking: query.data,
    status,
    done,
    timedOut: timedOut && !done,
    error: query.error,
    retry: () => {
      setTimedOut(false)
      setAttempt((a) => a + 1)
    },
  }
}

/** Contagem regressiva até um instante ISO; para de atualizar ao chegar em zero. */
export function useCountdown(target: string | undefined) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!target) return
    const end = new Date(target).getTime()
    const tick = () => {
      setNow(Date.now())
      if (Date.now() >= end) clearInterval(timer)
    }
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [target])
  const remainingMs = target ? Math.max(0, new Date(target).getTime() - now) : 0
  return { remainingMs, expired: target !== undefined && remainingMs === 0 }
}
