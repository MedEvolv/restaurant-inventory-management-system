import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import PlanPanel from './PlanPanel'
import LanguageProvider from './LanguageProvider'

const dates = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']
const timeDefaults = { BREAKFAST: '08:00', LUNCH: '13:00', DINNER: '20:00' }
const weekDates = start => Array.from({ length: 7 }, (_, index) => { const [year, month, day] = start.split('-').map(Number); const date = new Date(Date.UTC(year, month - 1, day + index)); return date.toISOString().slice(0, 10) })
function makeApi(plans = []) {
  return {
    get: vi.fn(path => path.startsWith('/calendar?start=') ? Promise.resolve({ start: path.split('=')[1], end: weekDates(path.split('=')[1]).at(-1), days: weekDates(path.split('=')[1]).map(date => ({ date, plans: date === dates[0] ? plans : [], mealTimes: timeDefaults })) }) : path === '/recipes' ? Promise.resolve([{ id: 8, name: 'Rajma', ingredients: [] }]) : Promise.resolve({ plans, lines: [], fingerprint: 'calendar-test' })),
    post: vi.fn().mockResolvedValue({ id: 12 }), put: vi.fn().mockResolvedValue({}), remove: vi.fn().mockResolvedValue({}),
  }
}
function renderPlanner(api, onDateChange = vi.fn()) {
  localStorage.setItem('group1-ui-language', 'en')
  const mutate = vi.fn(async operation => { await operation(); return true })
  function ControlledPlanner() { const [date, setDate] = useState(dates[0]); return <LanguageProvider><PlanPanel items={[]} planDate={date} onDateChange={value => { onDateChange(value); setDate(value) }} api={api} mutate={mutate} saving={false} reportError={vi.fn()} onDraftSaved={vi.fn()}/></LanguageProvider> }
  render(<ControlledPlanner />)
  return { mutate, onDateChange }
}

describe('task-first weekly planner', () => {
  it('uses UTC week navigation, empty meal times, and isolates unsaved times by date', async () => {
    const user = userEvent.setup()
    const api = makeApi()
    const { onDateChange } = renderPlanner(api)
    await screen.findByRole('button', { name: /Mon 28 Sept/ })
    expect(screen.getByLabelText('Serving time · Breakfast')).toHaveValue('08:00')
    expect(screen.getAllByText('No dishes planned')).toHaveLength(3)
    await user.clear(screen.getByLabelText('Serving time · Breakfast'))
    await user.type(screen.getByLabelText('Serving time · Breakfast'), '09:30')
    await user.click(screen.getByRole('button', { name: /Tue 29 Sept/ }))
    expect(onDateChange).toHaveBeenCalledWith(dates[1])
    const view = screen.getByLabelText('Serving time · Breakfast')
    expect(view).toHaveValue('08:00')
    await user.clear(view)
    await user.type(view, '08:15')
    await user.click(within(screen.getByRole('heading', { name: 'Breakfast' }).closest('section')).getByRole('button', { name: 'Save time' }))
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/meal-times', { date: dates[1], mealSlot: 'BREAKFAST', serveTime: '08:15' }))
    await user.click(screen.getByRole('button', { name: 'Next week' }))
    expect(onDateChange).toHaveBeenLastCalledWith('2026-10-06')
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/calendar?start=2026-10-05'))
  })

  it('adds only the current legacy portion as an extra option and keeps its value unchanged on edit', async () => {
    const user = userEvent.setup()
    const legacy = { id: 77, recipeId: 8, name: 'Rajma', portions: 120, mealSlot: 'UNASSIGNED', serveTime: null }
    const api = makeApi([legacy])
    renderPlanner(api)
    await screen.findByRole('button', { name: /Mon 28 Sept/ })
    const unassigned = screen.getByRole('heading', { name: 'Needs a meal' }).closest('section')
    await user.click(within(unassigned).getByRole('button', { name: 'Edit' }))
    const portions = screen.getByLabelText('Portions / covers')
    expect(portions).toHaveValue('120')
    expect([...portions.options].map(option => Number(option.value))).toEqual([30, 40, 50, 60, 70, 80, 90, 100, 120])
    await user.selectOptions(portions, '80')
    expect([...portions.options].map(option => Number(option.value))).toEqual([30, 40, 50, 60, 70, 80, 90, 100, 120])
    await user.selectOptions(portions, '120')
    await user.click(screen.getByRole('button', { name: 'Save planned dish' }))
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/plans/77', { ...legacy, recipeId: 8, portions: 120, mealSlot: 'UNASSIGNED', date: dates[0] }))
  })

  it('does not submit an empty or invalid date from the picker', async () => {
    const user = userEvent.setup()
    const api = makeApi()
    const { onDateChange } = renderPlanner(api)
    const picker = screen.getByLabelText('Choose date')
    fireEvent.change(picker, { target: { value: '2026-02-30' } })
    expect(onDateChange).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: /2026-09-28/ })).toBeInTheDocument()
  })
})
