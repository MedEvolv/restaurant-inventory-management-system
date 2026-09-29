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
    await user.selectOptions(await screen.findByLabelText('Operating view'), 'manager')
    const primary = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(within(primary).getAllByRole('button').map(button => button.textContent.trim())).toEqual(['Plan meals', 'Guides', 'More'])
    await user.click(within(primary).getByRole('button', { name: 'More' }))
    const secondary = screen.getByRole('navigation', { name: 'More sections' })
    expect(within(secondary).getAllByRole('button').map(button => button.textContent.trim())).toEqual(['Ingredients & buying', 'Dishes', 'Stock', 'Purchases', 'Records'])
  })

  it('shows loaded weekday entry counts and highlights the chosen day', async () => {
    const user = userEvent.setup()
    const dates = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']
    api.get.mockImplementation(path => path === '/ingredients' ? Promise.resolve([]) : path.startsWith('/calendar?') ? Promise.resolve({ start: '2026-09-28', end: '2026-10-04', days: dates.map((date,index) => ({ date, plans: index === 1 ? [{ id: 70, recipeId: 9, name: 'Rice', portions: 50 }] : [], mealTimes: {} })) }) : path === '/recipes' ? Promise.resolve([{ id: 9, name: 'Rice', active: true, ingredients: [] }]) : path === '/estimate?date=2026-09-28' ? Promise.resolve({ plans: [], lines: [], fingerprint: 'weekday-counts' }) : Promise.resolve([]))
    render(<PrepApp/>)
    await user.selectOptions(await screen.findByLabelText('Operating view'), 'manager')
    const select = await screen.findByLabelText('Weekday view')
    await waitFor(() => expect([...select.options].some(option => option.value === '2026-09-29' && option.textContent.includes('1 planned dish entries'))).toBe(true))
    await user.selectOptions(select, '2026-09-29')
    expect(screen.getByRole('button', { name: /Tue 29 Sept/ })).toHaveAttribute('aria-pressed', 'true')
  })
  it('keeps unsaved Hindi and English guide text mounted through Guides → staff Today → manager Guides', async () => {
    const user = userEvent.setup()
    render(<PrepApp/>)
    await user.selectOptions(await screen.findByLabelText('Operating view'), 'manager')
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
    await user.selectOptions(screen.getByLabelText('Operating view'), 'staff')
    expect(within(screen.getByRole('navigation', { name: 'Main navigation' })).getAllByRole('button').map(button => button.textContent.trim())).toEqual(['Today'])
    await user.selectOptions(await screen.findByLabelText('Operating view'), 'manager')
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
    await user.selectOptions(await screen.findByLabelText('Operating view'), 'manager')
    await user.click(await screen.findByRole('button', { name: 'More' }))
    await user.click(await screen.findByRole('button', { name: 'Ingredients & buying' }))
    await user.click(await screen.findByText('Edit purchase draft'))
    await user.click(await screen.findByRole('button', { name: 'Save purchase draft' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/drafts', expect.objectContaining({ date: '2026-09-28', fingerprint: 'nav-draft' })))
    await waitFor(() => expect(screen.getByRole('button', { name: 'More' })).toBeEnabled())
    expect(screen.getByRole('button', { name: 'Plan meals' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Guides' })).toBeEnabled()
    expect(screen.getByLabelText('Operating view')).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Plan meals' }))
    expect(await screen.findByRole('heading', { name: 'Plan meals' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Guides' }))
    expect(await screen.findByRole('heading', { name: 'Recipe guidance' })).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Operating view'), 'staff')
    expect(screen.getByLabelText('Operating view')).toHaveValue('staff')
  })
})
