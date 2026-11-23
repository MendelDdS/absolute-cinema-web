import { useSession } from '@/features/catalog'
import { formatBRL, formatDateTime } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Separator } from '@/shared/ui/separator'
import { Skeleton } from '@/shared/ui/skeleton'
import type { Booking } from '../api'

export function BookingSummary({ booking }: { booking: Booking }) {
  const session = useSession(booking.sessionId)
  return (
    <dl className="space-y-3 text-sm">
      {session.data ? (
        <>
          <Row label="Filme">{session.data.movieTitle}</Row>
          <Row label="Sala">{session.data.roomName}</Row>
          <Row label="Horário">{formatDateTime(session.data.startsAt)}</Row>
        </>
      ) : (
        <Skeleton className="h-16" />
      )}
      <Row label="Assentos">
        <span className="flex flex-wrap gap-1">
          {booking.seatCodes.map((c) => (
            <Badge key={c} variant="secondary">
              {c}
            </Badge>
          ))}
        </span>
      </Row>
      <Separator />
      <Row label="Total">
        <span className="text-lg font-semibold">{formatBRL(booking.totalAmount)}</span>
      </Row>
    </dl>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  )
}
