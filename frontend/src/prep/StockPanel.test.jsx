import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StockPanel from './StockPanel'

describe('Stock receipt form', () => {
  it('lets the manager record quantity, unit cost, and an unknown date', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn(async operation => operation())
    const post = vi.fn(async () => ({}))
    render(<StockPanel items={[{id: 1, name: 'Tomatoes', unit: 'kg', onHand: '7', lots: []}]} today="2026-09-28" mutate={mutate} api={{post}} />)
    await user.click(screen.getByRole('button', {name: 'Receive stock'}))
    await user.type(screen.getByLabelText('Received quantity'), '2.5')
    await user.type(screen.getByLabelText('Cost per received unit (₹)'), '30')
    await user.click(screen.getByRole('button', {name: 'Record receipt'}))
    expect(post).toHaveBeenCalledWith('/receipts', expect.objectContaining({ingredientId: '1', quantity: '2.5', unit: 'kg', unitCost: '30', dateType: 'UNKNOWN'}))
    expect(post.mock.calls[0][1].requestKey).toBeTruthy()
  })
})
