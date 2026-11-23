import { addDays, format, isToday, isTomorrow, startOfToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toDateParam } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

interface DayStripProps {
  value: string
  onChange: (date: string) => void
  days?: number
}

const label = (d: Date) =>
  isToday(d) ? 'Hoje' : isTomorrow(d) ? 'Amanhã' : format(d, 'EEE', { locale: ptBR })

/** Seletor dos próximos N dias (padrão 7). */
export function DayStrip({ value, onChange, days = 7 }: DayStripProps) {
  const today = startOfToday()
  return (
    <div
      role="group"
      aria-label="Escolha a data"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
    >
      {Array.from({ length: days }, (_, i) => addDays(today, i)).map((d) => {
        const param = toDateParam(d)
        const active = param === value
        return (
          <button
            key={param}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(param)}
            className={cn(
              'flex min-w-16 shrink-0 flex-col items-center rounded-lg border px-3 py-2 text-sm transition-colors',
              'focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-card hover:bg-muted',
            )}
          >
            <span className="text-xs capitalize opacity-80">{label(d)}</span>
            <span className="text-lg font-semibold">{format(d, 'd')}</span>
            <span className="text-xs capitalize opacity-80">
              {format(d, 'MMM', { locale: ptBR })}
            </span>
          </button>
        )
      })}
    </div>
  )
}
