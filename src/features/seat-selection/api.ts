import { z } from 'zod'
import { createClient } from '@/shared/api'
import { env } from '@/shared/lib/env'

const client = createClient(env.bookingApi)

export const seatStatusSchema = z.enum(['AVAILABLE', 'HELD', 'BOOKED'])
export const seatSchema = z.object({
  code: z.string(),
  row: z.string(),
  number: z.number().int(),
  status: seatStatusSchema,
})
export type Seat = z.infer<typeof seatSchema>
export type SeatStatus = z.infer<typeof seatStatusSchema>

export const getSessionSeats = (sessionId: string) =>
  client(`/sessions/${sessionId}/seats`, z.array(seatSchema))
