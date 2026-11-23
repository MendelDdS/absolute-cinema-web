import { CheckIcon, ClockIcon, XIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { SEAT_CLASS, SEAT_LABEL, type SeatVisual } from './seat-visuals'

const items: { visual: SeatVisual; icon?: typeof CheckIcon }[] = [
  { visual: 'AVAILABLE' },
  { visual: 'SELECTED', icon: CheckIcon },
  { visual: 'HELD', icon: ClockIcon },
  { visual: 'BOOKED', icon: XIcon },
]

export function SeatLegend() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Legenda">
      {items.map(({ visual, icon: Icon }) => (
        <li key={visual} className="flex items-center gap-2">
          <span
            className={cn(
              'flex size-6 items-center justify-center rounded-t-md rounded-b-xs border-2 text-[10px]',
              SEAT_CLASS[visual],
            )}
            aria-hidden
          >
            {Icon ? <Icon className="size-3.5" /> : '1'}
          </span>
          <span className="capitalize">{SEAT_LABEL[visual]}</span>
        </li>
      ))}
    </ul>
  )
}
