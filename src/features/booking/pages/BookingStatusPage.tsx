import {
  CircleCheckIcon,
  CircleXIcon,
  LoaderCircleIcon,
  TimerIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { Link, useParams } from 'react-router'
import { Button } from '@/shared/ui/button'
import { ErrorState } from '@/shared/components/state'
import { useBookingStatus } from '../hooks'

export function BookingStatusPage() {
  const { id = '' } = useParams()
  const { booking, status, timedOut, error, retry } = useBookingStatus(id)
  const seatsUrl = booking ? `/sessions/${booking.sessionId}/seats` : '/'

  let content: React.ReactNode
  if (error && !booking) {
    content = <ErrorState error={error} onRetry={retry} />
  } else if (status === 'CONFIRMED') {
    content = (
      <Status
        icon={CircleCheckIcon}
        tone="text-green-600 dark:text-green-400"
        title="Pagamento confirmado!"
      >
        <p>Seus ingressos foram emitidos.</p>
        <Button asChild size="lg">
          <Link to={`/bookings/${id}/tickets`}>Ver ingressos</Link>
        </Button>
      </Status>
    )
  } else if (status === 'CANCELLED') {
    content = (
      <Status icon={CircleXIcon} tone="text-destructive" title="Pagamento recusado">
        <p>A reserva foi cancelada e os assentos foram liberados.</p>
        <Button asChild variant="outline">
          <Link to={seatsUrl}>Escolher assentos novamente</Link>
        </Button>
      </Status>
    )
  } else if (status === 'EXPIRED') {
    content = (
      <Status icon={TimerIcon} tone="text-destructive" title="Reserva expirada">
        <p>O tempo para pagamento terminou.</p>
        <Button asChild variant="outline">
          <Link to={seatsUrl}>Voltar ao mapa de assentos</Link>
        </Button>
      </Status>
    )
  } else if (status === 'HELD') {
    content = (
      <Status icon={TriangleAlertIcon} tone="text-amber-600" title="Pagamento não iniciado">
        <Button asChild>
          <Link to={`/bookings/${id}/checkout`}>Ir para o pagamento</Link>
        </Button>
      </Status>
    )
  } else if (timedOut) {
    content = (
      <Status
        icon={TriangleAlertIcon}
        tone="text-amber-600"
        title="Está demorando mais que o esperado"
      >
        <p>O pagamento continua em processamento. Você pode continuar aguardando.</p>
        <Button onClick={retry}>Continuar aguardando</Button>
      </Status>
    )
  } else {
    content = (
      <Status icon={LoaderCircleIcon} tone="text-primary" title="Processando pagamento…" spin>
        <p>Aguarde, estamos confirmando com a operadora.</p>
      </Status>
    )
  }

  return (
    <div aria-live="polite" aria-atomic="true" className="mx-auto max-w-md py-10">
      {content}
    </div>
  )
}

interface StatusProps {
  icon: typeof CircleCheckIcon
  tone: string
  title: string
  spin?: boolean
  children?: React.ReactNode
}

function Status({ icon: Icon, tone, title, spin, children }: StatusProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Icon className={`size-16 ${tone} ${spin ? 'animate-spin' : ''}`} aria-hidden />
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="text-muted-foreground flex flex-col items-center gap-3">{children}</div>
    </div>
  )
}
