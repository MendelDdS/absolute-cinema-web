import { z } from 'zod'
import { createClient } from '@/shared/api'
import { env } from '@/shared/lib/env'

const client = createClient(env.catalogApi)

export const movieSchema = z.object({
  id: z.string(),
  title: z.string(),
  durationMinutes: z.number().int().positive(),
})
export const roomSchema = z.object({
  id: z.string(),
  name: z.string(),
  capacity: z.number().int().positive(),
})
export const sessionSchema = z.object({
  id: z.string(),
  movieId: z.string(),
  movieTitle: z.string(),
  roomId: z.string(),
  roomName: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  price: z.number().nonnegative(),
})

export type Movie = z.infer<typeof movieSchema>
export type Room = z.infer<typeof roomSchema>
export type Session = z.infer<typeof sessionSchema>
export interface MovieInput {
  title: string
  durationMinutes: number
}
export interface RoomInput {
  name: string
  rows: number
  seatsPerRow: number
}
export interface SessionInput {
  movieId: string
  roomId: string
  startsAt: string
  price: number
}
export interface SessionsQuery {
  movieId?: string
  date?: string
}

export const catalogApi = {
  getMovies: () => client('/movies', z.array(movieSchema)),
  getMovie: (id: string) => client(`/movies/${id}`, movieSchema),
  createMovie: (body: MovieInput) => client('/movies', movieSchema, { method: 'POST', body }),
  getRooms: () => client('/rooms', z.array(roomSchema)),
  createRoom: (body: RoomInput) => client('/rooms', roomSchema, { method: 'POST', body }),
  getSessions: (query: SessionsQuery) =>
    client('/sessions', z.array(sessionSchema), { query: { ...query } }),
  getSession: (id: string) => client(`/sessions/${id}`, sessionSchema),
  createSession: (body: SessionInput) =>
    client('/sessions', sessionSchema, { method: 'POST', body }),
}
