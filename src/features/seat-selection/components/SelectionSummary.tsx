import { TicketIcon } from 'lucide-react'
import { formatBRL } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

interface SelectionSummaryProps {
  selected: string[]
  price: number
  pending: boolean
  onReserve: () => void
}

/** Lateral no desktop; barra fixa no rodapé no mobile. */
export function SelectionSummary({ selected, price, pending, onReserve }: SelectionSummaryProps) {
  const total = selected.length * price
  return (
    <aside
      aria-label="Resumo da seleção"
      className="bg-background/95 lg:bg-card fixed inset-x-0 bottom-0 z-10 border-t p-4 backdrop-blur lg:sticky lg:top-20 lg:rounded-xl lg:border lg:p-5"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 lg:flex-col lg:items-stretch">
        <div className="min-w-0 space-y-1">
          <p className="text-muted-foreground text-sm">
            {selected.length === 0
              ? 'Nenhum assento selecionado'
              : `${selected.length} ${selected.length === 1 ? 'assento' : 'assentos'} · ${formatBRL(price)} cada`}
          </p>
          <div className="flex flex-wrap gap-1" aria-live="polite" aria-atomic="true">
            {selected.map((c) => (
              <Badge key={c}>{c}</Badge>
            ))}
          </div>
          <p className="text-xl font-semibold">{formatBRL(total)}</p>
        </div>
        <Button size="lg" disabled={selected.length === 0 || pending} onClick={onReserve}>
          <TicketIcon aria-hidden /> {pending ? 'Reservando…' : 'Reservar'}
        </Button>
      </div>
    </aside>
  )
}
