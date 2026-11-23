import { QRCodeSVG } from 'qrcode.react'
import type { Session } from '@/features/catalog'
import { formatDateTime } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent } from '@/shared/ui/card'
import type { Ticket } from '../api'

export function TicketCard({ ticket, session }: { ticket: Ticket; session?: Session }) {
  return (
    <Card data-testid="ticket" className="print:break-inside-avoid print:shadow-none">
      <CardContent className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-lg bg-white p-3">
          <QRCodeSVG
            value={ticket.code}
            size={160}
            marginSize={0}
            aria-label={`QR Code do ingresso ${ticket.code}`}
          />
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold">{ticket.seatCode}</p>
          {session && (
            <>
              <p className="font-medium">{session.movieTitle}</p>
              <p className="text-muted-foreground text-sm">
                {session.roomName} · {formatDateTime(session.startsAt)}
              </p>
            </>
          )}
          <p className="text-muted-foreground font-mono text-xs break-all">{ticket.code}</p>
          <Badge variant={ticket.status === 'VALID' ? 'default' : 'secondary'}>
            {ticket.status === 'VALID' ? 'Válido' : 'Utilizado'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
