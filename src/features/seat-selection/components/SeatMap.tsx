import { CheckIcon, ClockIcon, XIcon } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { cn } from '@/shared/lib/utils'
import type { Seat } from '../api'

import { SEAT_CLASS, SEAT_LABEL, type SeatVisual } from './seat-visuals'

const SEAT_ICON: Record<Exclude<SeatVisual, 'AVAILABLE'>, typeof CheckIcon> = {
  SELECTED: CheckIcon,
  HELD: ClockIcon,
  BOOKED: XIcon,
}

interface SeatMapProps {
  seats: Seat[]
  selected: string[]
  conflicts?: string[]
  onToggle: (code: string) => void
}

export function SeatMap({ seats, selected, conflicts = [], onToggle }: SeatMapProps) {
  const rows = useMemo(() => {
    const map = new Map<string, Seat[]>()
    for (const s of seats) map.set(s.row, [...(map.get(s.row) ?? []), s])
    for (const list of map.values()) list.sort((a, b) => a.number - b.number)
    return new Map([...map].sort(([a], [b]) => a.localeCompare(b)))
  }, [seats])
  const rowKeys = [...rows.keys()]
  const selectedSet = new Set(selected)
  const conflictSet = new Set(conflicts)

  const refs = useRef(new Map<string, HTMLButtonElement>())
  const [focused, setFocused] = useState<string | null>(null)
  const tabStop = focused ?? seats.find((s) => s.status === 'AVAILABLE')?.code ?? seats[0]?.code

  const nearestInRow = (row: string, number: number) => {
    const list = rows.get(row) ?? []
    return list.reduce<Seat | undefined>(
      (best, s) =>
        !best || Math.abs(s.number - number) < Math.abs(best.number - number) ? s : best,
      undefined,
    )
  }

  const onKeyDown = (e: React.KeyboardEvent, seat: Seat) => {
    const list = rows.get(seat.row) ?? []
    const idx = list.indexOf(seat)
    const rowIdx = rowKeys.indexOf(seat.row)
    const moves: Record<string, () => Seat | undefined> = {
      ArrowRight: () => list[idx + 1],
      ArrowLeft: () => list[idx - 1],
      ArrowDown: () => nearestInRow(rowKeys[rowIdx + 1] ?? '', seat.number),
      ArrowUp: () => nearestInRow(rowKeys[rowIdx - 1] ?? '', seat.number),
      Home: () => list[0],
      End: () => list[list.length - 1],
    }
    const next = moves[e.key]?.()
    if (!next) return
    e.preventDefault()
    setFocused(next.code)
    refs.current.get(next.code)?.focus()
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="mx-auto w-max min-w-full px-2">
        <div
          className="bg-foreground/70 mx-auto mb-1 h-2 w-3/4 min-w-48 rounded-b-[100%]"
          aria-hidden
        />
        <p className="text-muted-foreground mb-6 text-center text-xs tracking-[0.3em] uppercase">
          Tela
        </p>
        <p id="seatmap-help" className="sr-only">
          Use as setas para navegar entre os assentos e Enter ou Espaço para selecionar.
        </p>
        <div className="flex flex-col items-center gap-1.5" aria-describedby="seatmap-help">
          {rowKeys.map((row) => (
            <div
              key={row}
              role="group"
              aria-label={`Fileira ${row}`}
              className="flex items-center gap-1.5"
            >
              <span
                className="text-muted-foreground w-5 text-center text-xs font-medium"
                aria-hidden
              >
                {row}
              </span>
              {(rows.get(row) ?? []).map((seat) => {
                const visual: SeatVisual = selectedSet.has(seat.code) ? 'SELECTED' : seat.status
                const conflict = conflictSet.has(seat.code)
                const Icon = visual === 'AVAILABLE' ? null : SEAT_ICON[visual]
                const selectable = visual === 'AVAILABLE' || visual === 'SELECTED'
                return (
                  <button
                    key={seat.code}
                    ref={(el) => {
                      if (el) refs.current.set(seat.code, el)
                      else refs.current.delete(seat.code)
                    }}
                    type="button"
                    tabIndex={seat.code === tabStop ? 0 : -1}
                    aria-label={`Assento ${seat.code}, ${SEAT_LABEL[visual]}${conflict ? ', acabou de ficar indisponível' : ''}`}
                    aria-pressed={selectable ? visual === 'SELECTED' : undefined}
                    aria-disabled={selectable ? undefined : true}
                    data-seat={seat.code}
                    data-status={visual}
                    onClick={() => selectable && onToggle(seat.code)}
                    onFocus={() => setFocused(seat.code)}
                    onKeyDown={(e) => onKeyDown(e, seat)}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-t-lg rounded-b-sm border-2 text-xs font-medium transition-colors sm:size-9',
                      'focus-visible:ring-ring/60 focus-visible:ring-3 focus-visible:outline-none',
                      SEAT_CLASS[visual],
                      !selectable && 'cursor-not-allowed',
                      conflict &&
                        'ring-destructive ring-offset-background animate-pulse ring-2 ring-offset-2',
                    )}
                  >
                    {Icon ? <Icon className="size-4" aria-hidden /> : seat.number}
                  </button>
                )
              })}
              <span
                className="text-muted-foreground w-5 text-center text-xs font-medium"
                aria-hidden
              >
                {row}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
