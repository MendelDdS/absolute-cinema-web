import { useMutation, useQuery } from '@tanstack/react-query'
import { ticketsApi } from './api'

export const ticketKeys = { byBooking: (id: string) => ['tickets', id] as const }

export const useTickets = (bookingId: string, enabled = true) =>
  useQuery({
    queryKey: ticketKeys.byBooking(bookingId),
    queryFn: () => ticketsApi.list(bookingId),
    enabled,
  })

export const useValidateTicket = () => useMutation({ mutationFn: ticketsApi.validate })
