import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import PlanPanel from './PlanPanel'
import LanguageProvider from './LanguageProvider'

const date = '2026-09-28'
const times = { BREAKFAST: '08:00', LUNCH: '13:00', DINNER: '20:00' }
const calendar = { start: date, end: '2026-10-04', days: Array.from({ length: 7 }, (_, index) => { const day = new Date(`${date}T00:00:00Z`); day.setUTCDate(day.getUTCDate() + index); return { date: day.toISOString().slice(0, 10), plans: [], mealTimes: times } }) }
describe('planning action completion', () => {
  it('locks new actions through the saved plan reload, keeps the form alive, and sends the selected menu payload', async () => {
    localStorage.setItem('group1-ui-language', 'en')
    const user = userEvent.setup()
    const emptyEstimate = { plans: [], lines: [], fingerprint: 'initial' }
    let releaseRefresh
    const delayedRefresh = new Promise(resolve => { releaseRefresh = resolve })
    let estimateReads = 0
    const api = {
      get: vi.fn(path => path === '/calendar?start=2026-09-28' ? Promise.resolve(calendar) : path === '/recipes' ? Promise.resolve([{ id: 1, name: 'Test dish', ingredients: [] }]) : ++estimateReads === 1 ? Promise.resolve(emptyEstimate) : delayedRefresh),
      post: vi.fn().mockResolvedValue({ id: 10 }),
    }
    const mutate = vi.fn(async operation => { await operation(); return true })
    render(<LanguageProvider><PlanPanel items={[{ id: 1, name: 'Test ingredient', unit: 'kg' }]} planDate={date} api={api} mutate={mutate} saving={false} reportError={vi.fn()} onDraftSaved={vi.fn()}/></LanguageProvider>)
    const openPlan = screen.getAllByRole('button', { name: 'Add dish', exact: true })[0]
    await waitFor(() => expect(openPlan).toBeEnabled())
    await user.click(openPlan)
    const portions = screen.getByLabelText('Portions / covers')
    expect(portions).toHaveValue('50')
    expect([...portions.options].filter(option => option.value !== 'custom').map(option => Number(option.value))).toEqual([30, 40, 50, 60, 70, 80, 90, 100])
    await user.click(screen.getByRole('button', { name: 'Save planned dish', exact: true }))
    await waitFor(() => expect(estimateReads).toBe(2))
    expect(api.post).toHaveBeenCalledWith('/plans', { recipeId: 1, date, portions: 50, mealSlot: 'BREAKFAST' })
    const lockedDuringReload = openPlan.disabled
    await act(async () => { releaseRefresh({ ...emptyEstimate, fingerprint: 'saved' }) })
    expect(lockedDuringReload).toBe(true)
    await waitFor(() => expect(screen.queryByRole('combobox', { name: 'Dish', exact: true })).not.toBeInTheDocument())
    await user.click(openPlan)
    expect(screen.getByLabelText('Portions / covers')).toHaveValue('50')
  })
})
