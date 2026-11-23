import { createBrowserRouter, Navigate } from 'react-router'
import {
  AdminLayout,
  AdminMoviesPage,
  AdminRoomsPage,
  AdminSessionsPage,
  ValidateTicketPage,
} from '@/features/admin'
import { BookingStatusPage, CheckoutPage } from '@/features/booking'
import { MoviePage, MoviesPage } from '@/features/catalog'
import { SeatSelectionPage } from '@/features/seat-selection'
import { TicketsPage } from '@/features/tickets'
import { CustomerLayout, RouteErrorPage } from './layouts'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: CustomerLayout,
    ErrorBoundary: RouteErrorPage,
    children: [
      { index: true, Component: MoviesPage },
      { path: 'movies/:id', Component: MoviePage },
      { path: 'sessions/:id/seats', Component: SeatSelectionPage },
      { path: 'bookings/:id/checkout', Component: CheckoutPage },
      { path: 'bookings/:id/status', Component: BookingStatusPage },
      { path: 'bookings/:id/tickets', Component: TicketsPage },
    ],
  },
  {
    path: '/admin',
    Component: AdminLayout,
    ErrorBoundary: RouteErrorPage,
    children: [
      { index: true, element: <Navigate to="/admin/movies" replace /> },
      { path: 'movies', Component: AdminMoviesPage },
      { path: 'rooms', Component: AdminRoomsPage },
      { path: 'sessions', Component: AdminSessionsPage },
      { path: 'validate', Component: ValidateTicketPage },
    ],
  },
  { path: '*', Component: RouteErrorPage },
])
