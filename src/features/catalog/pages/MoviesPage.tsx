import { FilmIcon } from 'lucide-react'
import { Skeleton } from '@/shared/ui/skeleton'
import { EmptyState, ErrorState } from '@/shared/components/state'
import { DayStrip } from '../components/DayStrip'
import { MovieCard } from '../components/MovieCard'
import { useMovies, useSessions } from '../hooks'
import { useDateParam } from '../useDateParam'

export function MoviesPage() {
  const [date, setDate] = useDateParam()
  const movies = useMovies()
  const sessions = useSessions({ date })

  const countByMovie = new Map<string, number>()
  for (const s of sessions.data ?? []) {
    countByMovie.set(s.movieId, (countByMovie.get(s.movieId) ?? 0) + 1)
  }
  const inTheaters = (movies.data ?? []).filter((m) => countByMovie.has(m.id))

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <h1 className="text-2xl font-bold">Em cartaz</h1>
        <DayStrip value={date} onChange={setDate} />
      </header>

      {movies.isPending || sessions.isPending ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" aria-busy>
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : movies.isError || sessions.isError ? (
        <ErrorState
          error={movies.error ?? sessions.error}
          onRetry={() => {
            void movies.refetch()
            void sessions.refetch()
          }}
        />
      ) : inTheaters.length === 0 ? (
        <EmptyState
          icon={FilmIcon}
          title="Nenhuma sessão nesta data"
          description="Escolha outro dia para ver os filmes em cartaz."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {inTheaters.map((m) => (
            <li key={m.id}>
              <MovieCard movie={m} sessionCount={countByMovie.get(m.id) ?? 0} date={date} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
