import { ArrowLeftIcon } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { seatConflictSchema, useHoldSeats } from '@/features/booking'
import { useSession } from '@/features/catalog'
import { getErrorMessage, isApiError } from '@/shared/api'
import { ErrorState } from '@/shared/components/state'
import { formatBRL, formatDateTime } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { SeatLegend } from '../components/SeatLegend'
import { SeatMap } from '../components/SeatMap'
import { SelectionSummary } from '../components/SelectionSummary'
import { useSeatSelection, useSessionSeats } from '../hooks'

export function SeatSelectionPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const session = useSession(id)
  const seats = useSessionSeats(id)
  const { selected, conflicts, toggle, markConflicts } = useSeatSelection(seats.data)
  const hold = useHoldSeats()

  const reserve = () =>
    hold.mutate(
      { sessionId: id, seatCodes: selected },
      {
        onSuccess: (booking) => navigate(`/bookings/${booking.id}/checkout`),
        onError: (error) => {
          if (isApiError(error, 409)) {
            const parsed = seatConflictSchema.safeParse(error.problem)
            markConflicts(parsed.success ? parsed.data.unavailableSeats : [])
            toast.warning(error.message || 'Alguns assentos acabaram de ficar indisponíveis.')
            void seats.refetch()
            return
          }
          toast.error(getErrorMessage(error))
        },
      },
    )

  if (session.isError)
    return <ErrorState error={session.error} onRetry={() => void session.refetch()} />

  return (
    <div className="space-y-6 pb-36 lg:pb-0">
      {session.data ? (
        <header className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to={`/movies/${session.data.movieId}`}>
              <ArrowLeftIcon aria-hidden /> {session.data.movieTitle}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Escolha seus assentos</h1>
          <p className="text-muted-foreground">
            {session.data.roomName} · {formatDateTime(session.data.startsAt)} ·{' '}
            {formatBRL(session.data.price)}
          </p>
        </header>
      ) : (
        <Skeleton className="h-20" aria-busy />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <section className="space-y-4" aria-label="Mapa de assentos">
          <SeatLegend />
          {seats.isPending ? (
            <Skeleton className="h-72" aria-busy />
          ) : seats.isError ? (
            <ErrorState error={seats.error} onRetry={() => void seats.refetch()} />
          ) : (
            <SeatMap
              seats={seats.data}
              selected={selected}
              conflicts={conflicts}
              onToggle={toggle}
            />
          )}
        </section>
        <SelectionSummary
          selected={selected}
          price={session.data?.price ?? 0}
          pending={hold.isPending}
          onReserve={reserve}
        />
      </div>
    </div>
  )
}
