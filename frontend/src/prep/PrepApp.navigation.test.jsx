import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PrepApp from './PrepApp'

const api = vi.hoisted(() => ({
  get: vi.fn(path => path === '/ingredients' ? Promise.resolve([]) : path.startsWith('/today?') ? Promise.resolve({ date: '2026-09-28', dishes: [], mealTimes: { BREAKFAST: '08:00', LUNCH: '13:00', DINNER: '20:00' } }) : path.startsWith('/calendar?') ? Promise.resolve({ start: '2026-09-28', end: '2026-10-04', days: ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'].map(date => ({ date, plans: [], mealTimes: { BREAKFAST: '08:00', LUNCH: '13:00', DINNER: '20:00' } })) }) : path === '/recipes' ? Promise.resolve([{ id: 9, name: 'Rajma', active: true, ingredients: [] }]) : path === '/estimate?date=2026-09-28' ? Promise.resolve({ plans: [], lines: [], fingerprint: 'test' }) : path === '/guidance' || path === '/escalations' ? Promise.resolve([]) : Promise.resolve([])),
  post: vi.fn(), put: vi.fn(), remove: vi.fn(), upload: vi.fn(),
}))
vi.mock('./api', () => ({ api, kitchenDate: () => '2026-09-28' }))
beforeEach(() => { localStorage.clear(); localStorage.setItem('group1-ui-language', 'en'); api.get.mockClear() })

describe('manager and staff navigation shell', () => {
  it('shows the approved primary navigation and exposes the preserved More operations', async () => {
    const user = userEvent.setup()
    render(<PrepApp/>)
    await user.click(await screen.findByRole('button', { name: 'Manager workspace' }))
    const primary = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(within(primary).getAllByRole('button').map(button => button.textContent.trim())).toEqual(['Plan meals', 'Guides', 'More'])
    await user.click(within(primary).getByRole('button', { name: 'More' }))
    const secondary = screen.getByRole('navigation', { name: 'More sections' })
    expect(within(secondary).getAllByRole('button').map(button => button.textContent.trim())).toEqual(['Ingredients & buying', 'Dishes', 'Stock', 'Purchases', 'Records'])
  })

  it('counts selected-date plans and only positive-stock date-review lots, then opens More → Stock', async () => {
    const user = userEvent.setup()
    const dates = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']
    api.get.mockImplementation(path => path === '/ingredients' ? Promise.resolve([{ id: 1, name: 'Rice', unit: 'kg', onHand: 2, lots: [{ id: 11, remaining: 2, labelDate: '2026-09-27' }, { id: 12, remaining: 4, labelDate: null }, { id: 13, remaining: 0, labelDate: '2026-09-01' }] }]) : path.startsWith('/calendar?') ? Promise.resolve({ start: '2026-09-28', end: '2026-10-04', days: dates.map((date,index) => ({ date, plans: index === 0 ? [{ id: 70, recipeId: 9, name: 'Rice', portions: 50, mealSlot: 'UNASSIGNED' }] : [], mealTimes: {} })) }) : path === '/recipes' ? Promise.resolve([{ id: 9, name: 'Rice', active: true, ingredients: [] }]) : path === '/estimate?date=2026-09-28' ? Promise.resolve({ plans: [], lines: [], fingerprint: 'action-counts' }) : path === '/guidance' || path === '/escalations' ? Promise.resolve([]) : Promise.resolve([]))
    render(<PrepApp/>)
    await user.click(await screen.findByRole('button', { name: 'Manager workspace' }))
    const actions = await screen.findByRole('region', { name: 'Manager actions for the selected date' })
    expect(within(actions).getByText('Planned dish entries for 2026-09-28')).toBeInTheDocument()
    expect(within(actions.querySelector('.action-count')).getByText('1', { selector: 'strong' })).toBeInTheDocument()
    expect(within(actions).getByRole('button', { name: /Lots with label dates before 2026-09-28/ })).toHaveTextContent('1')
    expect(within(actions).getByRole('button', { name: /Lots with unknown label dates/ })).toHaveTextContent('1')
    await user.click(within(actions).getByRole('button', { name: /Lots with label dates before 2026-09-28/ }))
    expect(await screen.findByRole('heading', { name: 'Stock & dates' })).toBeInTheDocument()
  })

  it('marks lot counts unavailable after a failed post-write refresh and restores them after retry', async () => {
    const user = userEvent.setup()
    let ingredientLoads = 0
    const lots = [{ id: 11, remaining: 2, labelDate: '2026-09-27' }]
    const dates = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']
    api.get.mockImplementation(path => {
      if (path === '/ingredients') { ingredientLoads += 1; return ingredientLoads === 2 ? Promise.reject(new Error('refresh timed out')) : Promise.resolve([{ id: 1, name: 'Rice', unit: 'kg', onHand: 2, lots }]) }
      if (path.startsWith('/calendar?')) return Promise.resolve({ start: '2026-09-28', end: '2026-10-04', days: dates.map(date => ({ date, plans: [], mealTimes: {} })) })
      if (path === '/recipes') return Promise.resolve([{ id: 9, name: 'Rice', active: true, ingredients: [] }])
      if (path === '/estimate?date=2026-09-28') return Promise.resolve({ plans: [], lines: [], fingerprint: 'refresh-counts' })
      return Promise.resolve([])
    })
    api.post.mockResolvedValue({ id: 2 })
    render(<PrepApp/>)
    await user.click(await screen.findByRole('button', { name: 'Manager workspace' }))
    await user.click(await screen.findByRole('button', { name: 'More' }))
    await user.click(await screen.findByRole('button', { name: 'Stock' }))
    await user.click(await screen.findByRole('button', { name: 'Add ingredient' }))
    await user.type(screen.getByLabelText('Ingredient name'), 'Beans')
    await user.click(screen.getByRole('button', { name: 'Create ingredient' }))
    expect(await screen.findByText(/stock did not refresh/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Plan meals' }))
    const actions = await screen.findByRole('region', { name: 'Manager actions for the selected date' })
    const pastDateAction = within(actions).getByRole('button', { name: /Lots with label dates before 2026-09-28/ })
    expect(pastDateAction).toHaveTextContent('Unavailable')
    expect(pastDateAction).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Refresh' }))
    await waitFor(() => expect(pastDateAction).toHaveTextContent('1'))
    expect(pastDateAction).toBeEnabled()
    expect(ingredientLoads).toBe(3)
  })

  it('keeps unsaved Hindi and English guide text mounted through Guides → staff Today → manager Guides', async () => {
    const user = userEvent.setup()
    render(<PrepApp/>)
    await user.click(await screen.findByRole('button', { name: 'Manager workspace' }))
    await user.click(await screen.findByRole('button', { name: 'Guides' }))
    await user.click(await screen.findByRole('button', { name: 'New guide' }))
    await waitFor(() => expect(screen.getByLabelText('Recipe')).toHaveValue('9'))
    await user.type(screen.getByLabelText('Hindi document title (required)'), 'राजमा मार्गदर्शिका')
    await user.type(screen.getByLabelText('Responsible person'), 'Kitchen lead')
    await user.type(screen.getByLabelText('Method / ordered instructions'), 'हिन्दी में सावधानी से मिलाएँ')
    await user.click(screen.getByRole('tab', { name: 'English content' }))
    await user.type(screen.getByLabelText('English title'), 'Rajma guide')
    await user.type(screen.getByLabelText('Method / ordered instructions'), 'Stir carefully in English')
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Staff view' }))
    expect(within(screen.getByRole('navigation', { name: 'Main navigation' })).getAllByRole('button').map(button => button.textContent.trim())).toEqual(['Today'])
    await user.click(await screen.findByRole('button', { name: 'Manager workspace' }))
    await user.click(await screen.findByRole('button', { name: 'Guides' }))
    await user.click(screen.getByRole('tab', { name: 'English content' }))
    expect(screen.getByLabelText('English title')).toHaveValue('Rajma guide')
    expect(screen.getByLabelText('Method / ordered instructions')).toHaveValue('Stir carefully in English')
    await user.click(screen.getByRole('tab', { name: 'Hindi content' }))
    expect(screen.getByLabelText('Hindi document title (required)')).toHaveValue('राजमा मार्गदर्शिका')
    expect(screen.getByLabelText('Method / ordered instructions')).toHaveValue('हिन्दी में सावधानी से मिलाएँ')
    expect(screen.getByText(/Text changes are unsaved/)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled(); expect(api.put).not.toHaveBeenCalled()
  })

  it('releases navigation busy state when saving a purchase draft unmounts the planner', async () => {
    const user = userEvent.setup()
    api.get.mockImplementation(path => path === '/ingredients' ? Promise.resolve([]) : path.startsWith('/calendar?') ? Promise.resolve({ start: '2026-09-28', end: '2026-10-04', days: ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'].map(date => ({ date, plans: [], mealTimes: {} })) }) : path === '/recipes' ? Promise.resolve([{ id: 9, name: 'Rice', active: true, ingredients: [] }]) : path === '/estimate?date=2026-09-28' ? Promise.resolve({ plans: [], fingerprint: 'nav-draft', lines: [{ ingredientId: 4, name: 'Rice', unit: 'kg', required: 2, onHand: 0, excluded: 0, usable: 0, buffer: 0, suggested: 2, rawSuggestion: 2, increment: 0, breakdown: [], reviewLots: [] }] }) : path === '/guidance' || path === '/escalations' ? Promise.resolve([]) : Promise.resolve([]))
    api.post.mockResolvedValue({ id: 15 })
    render(<PrepApp/>)
    await user.click(await screen.findByRole('button', { name: 'Manager workspace' }))
    await user.click(await screen.findByRole('button', { name: 'More' }))
    await user.click(await screen.findByRole('button', { name: 'Ingredients & buying' }))
    await user.click(await screen.findByText('Edit purchase draft'))
    await user.click(await screen.findByRole('button', { name: 'Save purchase draft' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/drafts', expect.objectContaining({ date: '2026-09-28', fingerprint: 'nav-draft' })))
    await waitFor(() => expect(screen.getByRole('button', { name: 'More' })).toBeEnabled())
    expect(screen.getByRole('button', { name: 'Plan meals' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Guides' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Staff view' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Plan meals' }))
    expect(await screen.findByRole('heading', { name: 'Plan meals' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Guides' }))
    expect(await screen.findByRole('heading', { name: 'Recipe guidance' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Staff view' }))
    expect(await screen.findByRole('button', { name: 'Manager workspace' })).toBeEnabled()
  })
})
