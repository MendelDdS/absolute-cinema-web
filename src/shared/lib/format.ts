import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatBRL = (value: number) => brl.format(value)
export const formatTime = (iso: string) => format(new Date(iso), 'HH:mm', { locale: ptBR })
export const formatDateTime = (iso: string) =>
  format(new Date(iso), "EEE, d 'de' MMM 'às' HH:mm", { locale: ptBR })
export const formatDateLong = (date: Date) => format(date, "EEEE, d 'de' MMMM", { locale: ptBR })
export const toDateParam = (date: Date) => format(date, 'yyyy-MM-dd')
export const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return [h && `${h}h`, m && `${m}min`].filter(Boolean).join(' ') || '0min'
}
export const formatCountdown = (ms: number) => {
  const total = Math.ceil(ms / 1000)
  const mm = String(Math.floor(total / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return `${mm}:${ss}`
}
