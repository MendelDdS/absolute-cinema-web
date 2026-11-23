import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Countdown } from './Countdown'

describe('Countdown', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('mostra mm:ss, decrementa e sinaliza expiração', () => {
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
    const onExpire = vi.fn()
    render(<Countdown expiresAt="2026-01-01T12:02:05Z" onExpire={onExpire} />)

    expect(screen.getByRole('timer')).toHaveTextContent('02:05')
    expect(screen.getByText('2 minutos restantes para pagar.')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(66_000))
    expect(screen.getByRole('timer')).toHaveTextContent('00:59')
    expect(screen.getByText('Menos de um minuto para pagar.')).toBeInTheDocument()
    expect(onExpire).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(60_000))
    expect(screen.getByRole('timer')).toHaveTextContent('Expirada')
    expect(screen.getByText('Sua reserva expirou.')).toBeInTheDocument()
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('já começa expirada quando o prazo está no passado', () => {
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
    render(<Countdown expiresAt="2026-01-01T11:00:00Z" />)
    expect(screen.getByRole('timer')).toHaveTextContent('Expirada')
  })
})
