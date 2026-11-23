import { ArmchairIcon } from 'lucide-react'
import { Link } from 'react-router'
import { formatBRL, formatTime } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import type { Session } from '../api'

/** Sessões do dia agrupadas por horário de início. */
export function SessionList({ sessions }: { sessions: Session[] }) {
  const groups = new Map<string, Session[]>()
  for (const s of [...sessions].sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
    const key = formatTime(s.startsAt)
    groups.set(key, [...(groups.get(key) ?? []), s])
  }
  return (
    <ul className="space-y-4">
      {[...groups].map(([time, list]) => (
        <li key={time} className="bg-card rounded-lg border p-4">
          <p className="text-2xl font-semibold tabular-nums">{time}</p>
          <ul className="mt-3 divide-y">
            {list.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{s.roomName}</p>
                  <p className="text-muted-foreground text-sm">
                    Até {formatTime(s.endsAt)} · {formatBRL(s.price)}
                  </p>
                </div>
                <Button asChild>
                  <Link to={`/sessions/${s.id}/seats`}>
                    <ArmchairIcon aria-hidden /> Escolher assentos
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}
