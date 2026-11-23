import { ArrowLeftIcon, CalendarDaysIcon, ClockIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { formatDuration } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { EmptyState, ErrorState } from '@/shared/components/state'
import { DayStrip } from '../components/DayStrip'
import { SessionList } from '../components/SessionList'
import { useMovie, useSessions } from '../hooks'
import { useDateParam } from '../useDateParam'

export function MoviePage() {
  const { id = '' } = useParams()
  const [date, setDate] = useDateParam()
  const movie = useMovie(id)
  const sessions = useSessions({ movieId: id, date })

  if (movie.isPending) {
    return (
      <div className="space-y-4" aria-busy>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-24" />
      </div>
    )
  }
  if (movie.isError) return <ErrorState error={movie.error} onRetry={() => void movie.refetch()} />

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to={{ pathname: '/', search: `?date=${date}` }}>
          <ArrowLeftIcon aria-hidden /> Em cartaz
        </Link>
      </Button>
      <header>
        <h1 className="text-3xl font-bold">{movie.data.title}</h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-1">
          <ClockIcon className="size-4" aria-hidden /> {formatDuration(movie.data.durationMinutes)}
        </p>
      </header>

      <section className="space-y-4" aria-labelledby="sessions-heading">
        <h2 id="sessions-heading" className="text-lg font-semibold">
          Sessões
        </h2>
        <DayStrip value={date} onChange={setDate} />
        {sessions.isPending ? (
          <Skeleton className="h-40" aria-busy />
        ) : sessions.isError ? (
          <ErrorState error={sessions.error} onRetry={() => void sessions.refetch()} />
        ) : sessions.data.length === 0 ? (
          <EmptyState icon={CalendarDaysIcon} title="Sem sessões nesta data" />
        ) : (
          <SessionList sessions={sessions.data} />
        )}
      </section>
    </div>
  )
}
