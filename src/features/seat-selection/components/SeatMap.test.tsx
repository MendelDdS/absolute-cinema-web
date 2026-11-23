import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Seat } from '../api'
import { SeatMap } from './SeatMap'

const seat = (row: string, number: number, status: Seat['status'] = 'AVAILABLE'): Seat => ({
  code: `${row}${number}`,
  row,
  number,
  status,
})
const seats: Seat[] = [
  seat('A', 1),
  seat('A', 2, 'HELD'),
  seat('A', 3, 'BOOKED'),
  seat('B', 1),
  seat('B', 2),
  seat('B', 3),
]

describe('SeatMap', () => {
  it('descreve cada assento com código e estado', () => {
    render(<SeatMap seats={seats} selected={['B2']} onToggle={() => {}} />)
    expect(screen.getByRole('button', { name: 'Assento A1, disponível' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Assento A2, reservado por outro cliente' }),
    ).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: 'Assento A3, vendido' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Assento B2, selecionado' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('alterna só assentos disponíveis ou selecionados', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<SeatMap seats={seats} selected={[]} onToggle={onToggle} />)
    await user.click(screen.getByRole('button', { name: 'Assento A1, disponível' }))
    await user.click(screen.getByRole('button', { name: 'Assento A3, vendido' }))
    await user.click(
      screen.getByRole('button', { name: 'Assento A2, reservado por outro cliente' }),
    )
    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onToggle).toHaveBeenCalledWith('A1')
  })

  it('navega com as setas e seleciona com Enter', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<SeatMap seats={seats} selected={[]} onToggle={onToggle} />)
    await user.tab()
    expect(screen.getByRole('button', { name: 'Assento A1, disponível' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('button', { name: /Assento A2/ })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: 'Assento B2, disponível' })).toHaveFocus()
    await user.keyboard('{End}')
    expect(screen.getByRole('button', { name: 'Assento B3, disponível' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onToggle).toHaveBeenCalledWith('B3')
  })

  it('destaca assentos que ficaram indisponíveis (409)', () => {
    render(<SeatMap seats={seats} selected={[]} conflicts={['A2']} onToggle={() => {}} />)
    expect(
      screen.getByRole('button', {
        name: 'Assento A2, reservado por outro cliente, acabou de ficar indisponível',
      }),
    ).toBeInTheDocument()
  })
})
