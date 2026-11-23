/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCKS?: string
  readonly VITE_CATALOG_API?: string
  readonly VITE_BOOKING_API?: string
  readonly VITE_TICKETS_API?: string
  readonly VITE_CUSTOMER_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
