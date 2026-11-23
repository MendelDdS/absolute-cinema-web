import { TimerIcon } from 'lucide-react'
import { useEffect } from 'react'
import { formatCountdown } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useCountdown } from '../hooks'

interface CountdownProps {
  expiresAt: string
  onExpire?: () => void
}

export function Countdown({ expiresAt, onExpire }: CountdownProps) {
  const { remainingMs, expired } = useCountdown(expiresAt)
  const minutes = Math.floor(remainingMs / 60_000)
  const urgent = !expired && remainingMs < 60_000

  useEffect(() => {
    if (expired) onExpire?.()
  }, [expired, onExpire])

  // Anúncio muda só a cada minuto (e no fim) para não saturar o leitor de tela.
  const announcement = expired
    ? 'Sua reserva expirou.'
    : minutes >= 1
      ? `${minutes} ${minutes === 1 ? 'minuto restante' : 'minutos restantes'} para pagar.`
      : 'Menos de um minuto para pagar.'

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 font-medium tabular-nums',
        urgent && 'border-destructive text-destructive',
        expired && 'bg-muted text-muted-foreground',
      )}
    >
      <TimerIcon className="size-4" aria-hidden />
      <span role="timer" aria-label="Tempo restante para pagar">
        {expired ? 'Expirada' : formatCountdown(remainingMs)}
      </span>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </div>
  )
}
