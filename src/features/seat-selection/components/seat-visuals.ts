export type SeatVisual = 'AVAILABLE' | 'SELECTED' | 'HELD' | 'BOOKED'

export const SEAT_LABEL: Record<SeatVisual, string> = {
  AVAILABLE: 'disponível',
  SELECTED: 'selecionado',
  HELD: 'reservado por outro cliente',
  BOOKED: 'vendido',
}

/** Cor + ícone/forma por estado: nunca só cor. */
export const SEAT_CLASS: Record<SeatVisual, string> = {
  AVAILABLE: 'border-foreground/40 bg-background text-foreground hover:bg-primary/10',
  SELECTED: 'border-primary bg-primary text-primary-foreground',
  HELD: 'border-dashed border-amber-600 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  BOOKED: 'border-transparent bg-muted text-muted-foreground',
}
