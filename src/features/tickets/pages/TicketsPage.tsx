import { PrinterIcon, TicketIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useBooking } from '@/features/booking'
import { useSession } from '@/features/catalog'
import { EmptyState, ErrorState } from '@/shared/components/state'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { TicketCard } from '../components/TicketCard'
import { useTickets } from '../hooks'

export function TicketsPage() {
  const { id = '' } = useParams()
  const booking = useBooking(id)
  const confirmed = booking.data?.status === 'CONFIRMED'
  const tickets = useTickets(id, confirmed)
  const session = useSession(booking.data?.sessionId)

  if (booking.isPending) return <Skeleton className="h-64" aria-busy />
  if (booking.isError)
    return <ErrorState error={booking.error} onRetry={() => void booking.refetch()} />

  if (!confirmed) {
    const pending = booking.data.status === 'PAYMENT_PENDING' || booking.data.status === 'HELD'
    return (
      <EmptyState
        icon={TicketIcon}
        title="Ingressos ainda não emitidos"
        description={
          pending
            ? 'O pagamento desta reserva ainda não foi concluído.'
            : 'Esta reserva não foi confirmada.'
        }
      >
        {pending && (
          <Button asChild>
            <Link to={`/bookings/${id}/${booking.data.status === 'HELD' ? 'checkout' : 'status'}`}>
              Acompanhar reserva
            </Link>
          </Button>
        )}
      </EmptyState>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-2xl font-bold">Meus ingressos</h1>
        <Button variant="outline" onClick={() => window.print()}>
          <PrinterIcon aria-hidden /> Imprimir
        </Button>
      </header>
      {tickets.isPending ? (
        <Skeleton className="h-64" aria-busy />
      ) : tickets.isError ? (
        <ErrorState error={tickets.error} onRetry={() => void tickets.refetch()} />
      ) : tickets.data.length === 0 ? (
        <EmptyState icon={TicketIcon} title="Nenhum ingresso encontrado" />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.data.map((t) => (
            <li key={t.id}>
              <TicketCard ticket={t} session={session.data} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
