import { ClockIcon, FilmIcon } from 'lucide-react'
import { Link } from 'react-router'
import { formatDuration } from '@/shared/lib/format'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import type { Movie } from '../api'

interface MovieCardProps {
  movie: Movie
  sessionCount: number
  date: string
}

export function MovieCard({ movie, sessionCount, date }: MovieCardProps) {
  return (
    <Link
      to={{ pathname: `/movies/${movie.id}`, search: `?date=${date}` }}
      className="group focus-visible:ring-ring/50 rounded-xl focus-visible:ring-3 focus-visible:outline-none"
    >
      <Card className="group-hover:border-primary/60 h-full transition-colors">
        <CardHeader>
          <div
            className="bg-muted flex aspect-[2/1] items-center justify-center rounded-lg"
            aria-hidden
          >
            <FilmIcon className="text-muted-foreground size-10" />
          </div>
          <CardTitle className="mt-3 text-base">{movie.title}</CardTitle>
          <CardDescription className="flex items-center gap-1">
            <ClockIcon className="size-3.5" aria-hidden />
            {formatDuration(movie.durationMinutes)}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {sessionCount === 1 ? '1 sessão' : `${sessionCount} sessões`}
        </CardContent>
      </Card>
    </Link>
  )
}
