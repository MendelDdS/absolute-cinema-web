import { z } from 'zod'
import { createClient } from '@/shared/api'
import { env } from '@/shared/lib/env'

const client = createClient(env.ticketsApi)

export const ticketSchema = z.object({
  id: z.string(),
  code: z.string(),
  seatCode: z.string(),
  sessionId: z.string(),
  status: z.enum(['VALID', 'USED']),
})
export type Ticket = z.infer<typeof ticketSchema>

export const ticketsApi = {
  list: (bookingId: string) => client('/tickets', z.array(ticketSchema), { query: { bookingId } }),
  validate: (code: string) =>
    client(`/tickets/${encodeURIComponent(code)}/validate`, ticketSchema, { method: 'POST' }),
}
