import { ArrowLeftIcon, CircleCheckIcon, CircleXIcon, LockIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { getErrorMessage } from '@/shared/api'
import { formatBRL } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Skeleton } from '@/shared/ui/skeleton'
import { ErrorState } from '@/shared/components/state'
import type { PaymentMethod } from '../api'
import { BookingSummary } from '../components/BookingSummary'
import { Countdown } from '../components/Countdown'
import { useBooking, useCancelBooking, usePayBooking } from '../hooks'

const options: {
  method: PaymentMethod
  label: string
  hint: string
  icon: typeof CircleCheckIcon
}[] = [
  {
    method: 'TEST_CARD_APPROVE',
    label: 'Cartão de teste — aprovar',
    hint: 'Simula um pagamento aprovado.',
    icon: CircleCheckIcon,
  },
  {
    method: 'TEST_CARD_DECLINE',
    label: 'Cartão de teste — recusar',
    hint: 'Simula um pagamento recusado.',
    icon: CircleXIcon,
  },
]

export function CheckoutPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const booking = useBooking(id)
  const pay = usePayBooking(id)
  const cancel = useCancelBooking(id)
  const [method, setMethod] = useState<PaymentMethod>('TEST_CARD_APPROVE')
  const [expired, setExpired] = useState(false)

  if (booking.isPending) return <Skeleton className="h-96" aria-busy />
  if (booking.isError)
    return <ErrorState error={booking.error} onRetry={() => void booking.refetch()} />

  const b = booking.data
  if (b.status === 'PAYMENT_PENDING') return <Navigate to={`/bookings/${id}/status`} replace />
  if (b.status === 'CONFIRMED') return <Navigate to={`/bookings/${id}/tickets`} replace />
  const seatsUrl = `/sessions/${b.sessionId}/seats`

  if (expired || b.status === 'EXPIRED' || b.status === 'CANCELLED') {
    const cancelled = b.status === 'CANCELLED'
    return (
      <Alert variant="destructive" className="mx-auto max-w-lg">
        <AlertTitle>{cancelled ? 'Reserva cancelada' : 'Sua reserva expirou'}</AlertTitle>
        <AlertDescription>
          {cancelled
            ? 'Esta reserva foi cancelada e os assentos foram liberados.'
            : 'O tempo para pagamento terminou e os assentos foram liberados. Escolha novamente.'}
          <Button asChild className="mt-3">
            <Link to={seatsUrl}>
              <ArrowLeftIcon aria-hidden /> Voltar ao mapa de assentos
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const onPay = () =>
    pay.mutate(method, {
      onSuccess: () => navigate(`/bookings/${id}/status`),
      onError: (e) => toast.error(getErrorMessage(e)),
    })
  const onCancel = () =>
    cancel.mutate(undefined, {
      onSuccess: () => {
        toast.success('Reserva cancelada.')
        navigate(seatsUrl)
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    })

  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Pagamento</h1>
          <Countdown expiresAt={b.expiresAt} onExpire={() => setExpired(true)} />
        </header>

        <fieldset className="space-y-3">
          <legend className="mb-2 font-medium">Forma de pagamento (simulada)</legend>
          <p className="text-muted-foreground text-sm">
            Nenhum dado real é coletado. Escolha um cenário para exercitar o fluxo.
          </p>
          {options.map((o) => (
            <label
              key={o.method}
              className={cn(
                'has-[:focus-visible]:ring-ring/50 flex cursor-pointer items-center gap-3 rounded-lg border p-4 has-[:focus-visible]:ring-3',
                method === o.method && 'border-primary bg-primary/5',
              )}
            >
              <input
                type="radio"
                name="method"
                value={o.method}
                checked={method === o.method}
                onChange={() => setMethod(o.method)}
                className="sr-only"
              />
              <o.icon className="size-5 shrink-0" aria-hidden />
              <span>
                <span className="block font-medium">{o.label}</span>
                <span className="text-muted-foreground block text-sm">{o.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={onPay} disabled={pay.isPending}>
            <LockIcon aria-hidden />{' '}
            {pay.isPending ? 'Enviando…' : `Pagar ${formatBRL(b.totalAmount)}`}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" variant="outline" disabled={cancel.isPending}>
                Cancelar reserva
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancelar reserva?</DialogTitle>
                <DialogDescription>
                  Os assentos {b.seatCodes.join(', ')} serão liberados para outros clientes.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="destructive" onClick={onCancel} disabled={cancel.isPending}>
                  Sim, cancelar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingSummary booking={b} />
        </CardContent>
      </Card>
    </div>
  )
}
