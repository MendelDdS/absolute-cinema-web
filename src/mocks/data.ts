import { addDays, addMinutes, set, startOfToday } from 'date-fns'

/** Parâmetros dos cenários simulados. */
export const HOLD_SECONDS = 600
export const PAYMENT_DELAY_MS = 3000
export const CLEANUP_MINUTES = 15
/** Assento "disputado": a primeira tentativa de reservá-lo em cada sessão devolve 409. */
export const CONTESTED_SEAT = 'E5'
const GHOST_HOLD_SECONDS = 90

export type SeatStatus = 'AVAILABLE' | 'HELD' | 'BOOKED'
export type BookingStatus = 'HELD' | 'PAYMENT_PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED'

export interface MovieRec {
  id: string
  title: string
  durationMinutes: number
}
export interface RoomRec {
  id: string
  name: string
  rows: number
  seatsPerRow: number
}
export interface SessionRec {
  id: string
  movieId: string
  roomId: string
  startsAt: string
  endsAt: string
  price: number
}
export interface SeatRec {
  code: string
  row: string
  number: number
  status: SeatStatus
  bookingId?: string
  heldUntil?: number
}
export interface BookingRec {
  id: string
  sessionId: string
  customerId: string
  status: BookingStatus
  seatCodes: string[]
  totalAmount: number
  expiresAt: string
}
export interface TicketRec {
  id: string
  code: string
  seatCode: string
  sessionId: string
  bookingId: string
  status: 'VALID' | 'USED'
  usedAt?: string
}

export const uid = () => crypto.randomUUID()

const movies: MovieRec[] = [
  ['A Última Sessão', 118],
  ['Horizonte Perdido', 142],
  ['Noites de Neon', 97],
  ['O Jardim Silencioso', 110],
  ['Maré Alta', 126],
  ['Código Vermelho', 135],
].map(([title, durationMinutes]) => ({
  id: uid(),
  title: String(title),
  durationMinutes: Number(durationMinutes),
}))

const rooms: RoomRec[] = [
  { id: uid(), name: 'Sala 1', rows: 8, seatsPerRow: 12 },
  { id: uid(), name: 'Sala 2', rows: 6, seatsPerRow: 10 },
  { id: uid(), name: 'Sala 3 — IMAX', rows: 10, seatsPerRow: 16 },
]

// 4 janelas por sala, 7 dias; janelas de 2h45 comportam qualquer filme + limpeza sem sobreposição.
const slots = [
  [13, 0],
  [15, 45],
  [18, 30],
  [21, 15],
] as const
const sessions: SessionRec[] = []
for (let day = 0; day < 7; day++) {
  rooms.forEach((room, r) => {
    slots.forEach(([hours, minutes], k) => {
      const movie = movies[(day + r + k) % movies.length]
      const start = set(addDays(startOfToday(), day), {
        hours,
        minutes,
        seconds: 0,
        milliseconds: 0,
      })
      sessions.push({
        id: uid(),
        movieId: movie.id,
        roomId: room.id,
        startsAt: start.toISOString(),
        endsAt: addMinutes(start, movie.durationMinutes + CLEANUP_MINUTES).toISOString(),
        price: r === 2 ? 48 : k >= 2 ? 36 : 28,
      })
    })
  })
}

export const db = {
  movies,
  rooms,
  sessions,
  seats: new Map<string, Map<string, SeatRec>>(),
  bookings: new Map<string, BookingRec>(),
  tickets: [] as TicketRec[],
  ghosted: new Set<string>(),
}

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

/** Mapa de assentos criado sob demanda, com ~1/6 dos lugares já vendidos. */
export function seatsFor(sessionId: string): Map<string, SeatRec> | undefined {
  const session = db.sessions.find((s) => s.id === sessionId)
  if (!session) return undefined
  let map = db.seats.get(sessionId)
  if (!map) {
    const room = db.rooms.find((r) => r.id === session.roomId)!
    map = new Map()
    for (let r = 0; r < room.rows; r++) {
      const row = String.fromCharCode(65 + r)
      for (let n = 1; n <= room.seatsPerRow; n++) {
        const code = `${row}${n}`
        const sold = code !== CONTESTED_SEAT && hash(sessionId + code) % 6 === 0
        map.set(code, { code, row, number: n, status: sold ? 'BOOKED' : 'AVAILABLE' })
      }
    }
    db.seats.set(sessionId, map)
  }
  return map
}

export function releaseSeats(sessionId: string, codes: string[]) {
  const map = seatsFor(sessionId)
  for (const code of codes) {
    const seat = map?.get(code)
    if (seat && seat.status !== 'BOOKED') {
      seat.status = 'AVAILABLE'
      delete seat.bookingId
      delete seat.heldUntil
    }
  }
}

/** Expira holds vencidos (reservas e o "fantasma" do assento disputado). */
export function sweepExpired() {
  const now = Date.now()
  for (const b of db.bookings.values()) {
    if (b.status === 'HELD' && new Date(b.expiresAt).getTime() <= now) {
      b.status = 'EXPIRED'
      releaseSeats(b.sessionId, b.seatCodes)
    }
  }
  for (const [sessionId, map] of db.seats) {
    for (const seat of map.values()) {
      if (
        seat.status === 'HELD' &&
        !seat.bookingId &&
        seat.heldUntil !== undefined &&
        seat.heldUntil <= now
      ) {
        releaseSeats(sessionId, [seat.code])
      }
    }
  }
}

export function createBooking(sessionId: string, seatCodes: string[], customerId: string) {
  const session = db.sessions.find((s) => s.id === sessionId)
  const map = seatsFor(sessionId)
  if (!session || !map) return { error: 'SESSION_NOT_FOUND' as const }
  const unknown = seatCodes.filter((c) => !map.has(c))
  if (unknown.length) return { error: 'UNKNOWN_SEATS' as const, seats: unknown }

  const unavailable = seatCodes.filter((c) => map.get(c)!.status !== 'AVAILABLE')
  // Cenário de concorrência: outro cliente "ganha" o assento disputado na primeira tentativa.
  if (
    seatCodes.includes(CONTESTED_SEAT) &&
    !db.ghosted.has(sessionId) &&
    !unavailable.includes(CONTESTED_SEAT)
  ) {
    db.ghosted.add(sessionId)
    const seat = map.get(CONTESTED_SEAT)!
    seat.status = 'HELD'
    seat.heldUntil = Date.now() + GHOST_HOLD_SECONDS * 1000
    unavailable.push(CONTESTED_SEAT)
  }
  if (unavailable.length) return { error: 'UNAVAILABLE' as const, seats: unavailable }

  const booking: BookingRec = {
    id: uid(),
    sessionId,
    customerId,
    status: 'HELD',
    seatCodes: [...seatCodes].sort(),
    totalAmount: seatCodes.length * session.price,
    expiresAt: new Date(Date.now() + HOLD_SECONDS * 1000).toISOString(),
  }
  for (const code of seatCodes) {
    const seat = map.get(code)!
    seat.status = 'HELD'
    seat.bookingId = booking.id
    seat.heldUntil = new Date(booking.expiresAt).getTime()
  }
  db.bookings.set(booking.id, booking)
  return { booking }
}

/** Pagamento assíncrono: 202 agora, resultado após PAYMENT_DELAY_MS. */
export function startPayment(booking: BookingRec, approve: boolean) {
  booking.status = 'PAYMENT_PENDING'
  setTimeout(() => {
    if (booking.status !== 'PAYMENT_PENDING') return
    if (approve) {
      booking.status = 'CONFIRMED'
      const map = seatsFor(booking.sessionId)
      for (const code of booking.seatCodes) {
        const seat = map?.get(code)
        if (seat) {
          seat.status = 'BOOKED'
          delete seat.heldUntil
        }
        db.tickets.push({
          id: uid(),
          code: `TCK-${uid().slice(0, 8).toUpperCase()}`,
          seatCode: code,
          sessionId: booking.sessionId,
          bookingId: booking.id,
          status: 'VALID',
        })
      }
    } else {
      booking.status = 'CANCELLED'
      releaseSeats(booking.sessionId, booking.seatCodes)
    }
  }, PAYMENT_DELAY_MS)
}

export function findOverlap(roomId: string, startsAt: Date, endsAt: Date) {
  return db.sessions.find(
    (s) => s.roomId === roomId && new Date(s.startsAt) < endsAt && new Date(s.endsAt) > startsAt,
  )
}
