import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { catalogApi, type SessionsQuery } from './api'

export const catalogKeys = {
  movies: ['movies'] as const,
  movie: (id: string) => ['movies', id] as const,
  rooms: ['rooms'] as const,
  sessions: (q: SessionsQuery) => ['sessions', q] as const,
  session: (id: string) => ['sessions', 'detail', id] as const,
}

export const useMovies = () =>
  useQuery({ queryKey: catalogKeys.movies, queryFn: catalogApi.getMovies })

export const useMovie = (id: string) =>
  useQuery({ queryKey: catalogKeys.movie(id), queryFn: () => catalogApi.getMovie(id) })

export const useRooms = () =>
  useQuery({ queryKey: catalogKeys.rooms, queryFn: catalogApi.getRooms })

export const useSessions = (query: SessionsQuery) =>
  useQuery({
    queryKey: catalogKeys.sessions(query),
    queryFn: () => catalogApi.getSessions(query),
    enabled: Boolean(query.date),
  })

export const useSession = (id: string | undefined) =>
  useQuery({
    queryKey: catalogKeys.session(id ?? ''),
    queryFn: () => catalogApi.getSession(id ?? ''),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  })

export function useCreateMovie() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: catalogApi.createMovie,
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKeys.movies }),
  })
}

export function useCreateRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: catalogApi.createRoom,
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKeys.rooms }),
  })
}

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: catalogApi.createSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}
