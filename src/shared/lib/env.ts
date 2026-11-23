export const env = {
  useMocks: import.meta.env.VITE_USE_MOCKS === 'true',
  catalogApi: import.meta.env.VITE_CATALOG_API ?? '/api/catalog',
  bookingApi: import.meta.env.VITE_BOOKING_API ?? '/api/booking',
  ticketsApi: import.meta.env.VITE_TICKETS_API ?? '/api/tickets',
  // Autenticação fora do escopo: cliente fixo de demonstração enviado em X-Customer-Id.
  customerId: import.meta.env.VITE_CUSTOMER_ID ?? 'demo-customer',
} as const
