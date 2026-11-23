import { addMinutes } from 'date-fns'
import { delay, http, HttpResponse, type DefaultBodyType } from 'msw'
import { z } from 'zod'
import { env } from '@/shared/lib/env'
import { formatTime, toDateParam } from '@/shared/lib/format'
import {
  CLEANUP_MINUTES,
  createBooking,
  db,
  findOverlap,
  seatsFor,
  startPayment,
  sweepExpired,
  uid,
  type RoomRec,
  type SessionRec,
} from './data'

const LATENCY_MS = import.meta.env.MODE === 'test' ? 0 : 250
const latency = () => delay(LATENCY_MS)

const problem = (
  status: number,
  title: string,
  detail: string,
  extra: Record<string, DefaultBodyType> = {},
) =>
  HttpResponse.json(
    { type: 'about:blank', title, status, detail, ...extra },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )

const parseBody = async <T>(request: Request, schema: z.ZodType<T>) => {
  const result = schema.safeParse(await request.json().catch(() => undefined))
  return result.success
    ? { data: result.data }
    : { error: problem(400, 'Requisição inválida', z.prettifyError(result.error)) }
}

const sessionDto = (s: SessionRec) => ({
  ...s,
  movieTitle: db.movies.find((m) => m.id === s.movieId)?.title ?? '',
  roomName: db.rooms.find((r) => r.id === s.roomId)?.name ?? '',
})

const C = env.catalogApi
const B = env.bookingApi
const T = env.ticketsApi

// Igual ao backend: 201 sem corpo, recurso criado no Location.
const created = (location: string) =>
  new HttpResponse(null, { status: 201, headers: { Location: location } })
const roomDto = (r: RoomRec) => ({ id: r.id, name: r.name, capacity: r.rows * r.seatsPerRow })

export const handlers = [
  // ---------- catalog-service ----------
  http.get(`${C}/movies`, async () => {
    await latency()
    return HttpResponse.json(db.movies)
  }),
  http.get(`${C}/movies/:id`, async ({ params }) => {
    await latency()
    const movie = db.movies.find((m) => m.id === params.id)
    return movie
      ? HttpResponse.json(movie)
      : problem(404, 'Não encontrado', 'Filme não encontrado.')
  }),
  http.post(`${C}/movies`, async ({ request }) => {
    await latency()
    const body = await parseBody(
      request,
      z.object({ title: z.string().min(1), durationMinutes: z.number().int().positive() }),
    )
    if (body.error) return body.error
    const movie = { id: uid(), ...body.data }
    db.movies.push(movie)
    return created(`/movies/${movie.id}`)
  }),

  http.get(`${C}/rooms`, async () => {
    await latency()
    return HttpResponse.json(db.rooms.map(roomDto))
  }),
  http.post(`${C}/rooms`, async ({ request }) => {
    await latency()
    const body = await parseBody(
      request,
      z.object({
        name: z.string().min(1),
        rows: z.number().int().min(1).max(26),
        seatsPerRow: z.number().int().min(1),
      }),
    )
    if (body.error) return body.error
    const room = { id: uid(), ...body.data }
    db.rooms.push(room)
    return created(`/rooms/${room.id}`)
  }),

  http.get(`${C}/sessions`, async ({ request }) => {
    await latency()
    const url = new URL(request.url)
    const movieId = url.searchParams.get('movieId')
    const date = url.searchParams.get('date')
    const list = db.sessions.filter(
      (s) =>
        (!movieId || s.movieId === movieId) &&
        (!date || toDateParam(new Date(s.startsAt)) === date),
    )
    return HttpResponse.json(list.map(sessionDto))
  }),
  http.get(`${C}/sessions/:id`, async ({ params }) => {
    await latency()
    const session = db.sessions.find((s) => s.id === params.id)
    return session
      ? HttpResponse.json(sessionDto(session))
      : problem(404, 'Não encontrado', 'Sessão não encontrada.')
  }),
  http.post(`${C}/sessions`, async ({ request }) => {
    await latency()
    const body = await parseBody(
      request,
      z.object({
        movieId: z.string(),
        roomId: z.string(),
        startsAt: z.string(),
        price: z.number().min(0),
      }),
    )
    if (body.error) return body.error
    const movie = db.movies.find((m) => m.id === body.data.movieId)
    const room = db.rooms.find((r) => r.id === body.data.roomId)
    if (!movie || !room) return problem(404, 'Não encontrado', 'Filme ou sala não encontrados.')
    const startsAt = new Date(body.data.startsAt)
    if (Number.isNaN(startsAt.getTime()))
      return problem(400, 'Requisição inválida', 'Data de início inválida.')
    const endsAt = addMinutes(startsAt, movie.durationMinutes + CLEANUP_MINUTES)
    const clash = findOverlap(room.id, startsAt, endsAt)
    if (clash) {
      const clashMovie = db.movies.find((m) => m.id === clash.movieId)?.title
      return problem(
        409,
        'Sobreposição de sessões',
        `${room.name} já tem "${clashMovie}" das ${formatTime(clash.startsAt)} às ${formatTime(clash.endsAt)}.`,
        { conflictingSessionId: clash.id },
      )
    }
    const session: SessionRec = {
      id: uid(),
      movieId: movie.id,
      roomId: room.id,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      price: body.data.price,
    }
    db.sessions.push(session)
    return created(`/sessions/${session.id}`)
  }),

  // ---------- booking-service ----------
  http.get(`${B}/sessions/:id/seats`, async ({ params }) => {
    await latency()
    sweepExpired()
    const map = seatsFor(String(params.id))
    if (!map) return problem(404, 'Não encontrado', 'Sessão não encontrada.')
    return HttpResponse.json(
      [...map.values()].map(({ code, row, number, status }) => ({ code, row, number, status })),
    )
  }),
  http.post(`${B}/bookings`, async ({ request }) => {
    await latency()
    sweepExpired()
    const body = await parseBody(
      request,
      z.object({ sessionId: z.string(), seatCodes: z.array(z.string()).min(1) }),
    )
    if (body.error) return body.error
    const customerId = request.headers.get('X-Customer-Id') ?? 'anonymous'
    const result = createBooking(body.data.sessionId, body.data.seatCodes, customerId)
    if ('booking' in result) return HttpResponse.json(result.booking, { status: 201 })
    if (result.error === 'SESSION_NOT_FOUND')
      return problem(404, 'Não encontrado', 'Sessão não encontrada.')
    if (result.error === 'UNKNOWN_SEATS')
      return problem(
        400,
        'Requisição inválida',
        `Assentos inexistentes: ${result.seats.join(', ')}.`,
      )
    const list = result.seats.join(', ')
    return problem(
      409,
      'Assentos indisponíveis',
      result.seats.length === 1
        ? `O assento ${list} acabou de ser reservado por outro cliente.`
        : `Os assentos ${list} acabaram de ser reservados por outro cliente.`,
      { unavailableSeats: result.seats },
    )
  }),
  http.get(`${B}/bookings/:id`, async ({ params }) => {
    await latency()
    sweepExpired()
    const booking = db.bookings.get(String(params.id))
    return booking
      ? HttpResponse.json(booking)
      : problem(404, 'Não encontrado', 'Reserva não encontrada.')
  }),
  http.post(`${B}/bookings/:id/payment`, async ({ params, request }) => {
    await latency()
    sweepExpired()
    const booking = db.bookings.get(String(params.id))
    if (!booking) return problem(404, 'Não encontrado', 'Reserva não encontrada.')
    const body = await parseBody(
      request,
      z.object({ method: z.enum(['TEST_CARD_APPROVE', 'TEST_CARD_DECLINE']) }),
    )
    if (body.error) return body.error
    if (booking.status === 'EXPIRED')
      return problem(409, 'Reserva expirada', 'O prazo para pagamento desta reserva terminou.')
    if (booking.status !== 'HELD')
      return problem(
        409,
        'Estado inválido',
        `A reserva está ${booking.status} e não aceita pagamento.`,
      )
    startPayment(booking, body.data.method === 'TEST_CARD_APPROVE')
    return HttpResponse.json(booking, { status: 202 })
  }),
  http.delete(`${B}/bookings/:id`, async ({ params }) => {
    await latency()
    sweepExpired()
    const booking = db.bookings.get(String(params.id))
    if (!booking) return problem(404, 'Não encontrado', 'Reserva não encontrada.')
    if (booking.status !== 'HELD')
      return problem(
        409,
        'Estado inválido',
        `Só reservas em espera podem ser canceladas (atual: ${booking.status}).`,
      )
    booking.status = 'CANCELLED'
    const map = seatsFor(booking.sessionId)
    for (const code of booking.seatCodes) {
      const seat = map?.get(code)
      if (seat) {
        seat.status = 'AVAILABLE'
        delete seat.bookingId
        delete seat.heldUntil
      }
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // ---------- ticket-service ----------
  http.get(`${T}/tickets`, async ({ request }) => {
    await latency()
    const bookingId = new URL(request.url).searchParams.get('bookingId')
    const list = db.tickets.filter((t) => !bookingId || t.bookingId === bookingId)
    return HttpResponse.json(
      list.map(({ id, code, seatCode, sessionId, status }) => ({
        id,
        code,
        seatCode,
        sessionId,
        status,
      })),
    )
  }),
  http.post(`${T}/tickets/:code/validate`, async ({ params }) => {
    await latency()
    const ticket = db.tickets.find((t) => t.code === decodeURIComponent(String(params.code)))
    if (!ticket) return problem(404, 'Não encontrado', 'Ingresso não encontrado.')
    if (ticket.status === 'USED') {
      return problem(
        409,
        'Ingresso já utilizado',
        `Este ingresso já foi utilizado às ${formatTime(ticket.usedAt!)}.`,
      )
    }
    ticket.status = 'USED'
    ticket.usedAt = new Date().toISOString()
    const { id, code, seatCode, sessionId, status } = ticket
    return HttpResponse.json({ id, code, seatCode, sessionId, status })
  }),
]
