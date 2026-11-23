import { z } from 'zod'
import { createClient } from '@/shared/api'
import { env } from '@/shared/lib/env'

const client = createClient(env.bookingApi)

export const bookingStatusSchema = z.enum([
  'HELD',
  'PAYMENT_PENDING',
  'CONFIRMED',
  'CANCELLED',
  'EXPIRED',
])
export type BookingStatus = z.infer<typeof bookingStatusSchema>

export const bookingSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  status: bookingStatusSchema,
  seatCodes: z.array(z.string()),
  totalAmount: z.number(),
  expiresAt: z.string(),
})
export type Booking = z.infer<typeof bookingSchema>

/** Pagamento simulado: nenhum dado real de cartão é coletado. */
export const paymentMethods = ['TEST_CARD_APPROVE', 'TEST_CARD_DECLINE'] as const
export type PaymentMethod = (typeof paymentMethods)[number]

/** Campo extra do Problem Details em 409 ao reservar. */
export const seatConflictSchema = z.object({ unavailableSeats: z.array(z.string()) })

export const isTerminalStatus = (s: BookingStatus) =>
  s === 'CONFIRMED' || s === 'CANCELLED' || s === 'EXPIRED'

export const bookingApi = {
  create: (body: { sessionId: string; seatCodes: string[] }) =>
    client('/bookings', bookingSchema, { method: 'POST', body }),
  get: (id: string) => client(`/bookings/${id}`, bookingSchema),
  pay: (id: string, method: PaymentMethod) =>
    client(`/bookings/${id}/payment`, z.unknown(), { method: 'POST', body: { method } }),
  cancel: (id: string) => client(`/bookings/${id}`, z.unknown(), { method: 'DELETE' }),
}
