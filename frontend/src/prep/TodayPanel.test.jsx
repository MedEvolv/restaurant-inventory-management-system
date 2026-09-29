import { beforeEach, describe, it, expect, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TodayPanel from './TodayPanel'
import LanguageProvider from './LanguageProvider'

const mealTimes = { BREAKFAST: '08:00', LUNCH: '13:00', DINNER: '20:00' }
const dish = (guidance = []) => ({ date: '2026-09-28', mealTimes, dishes: [{ planId: 4, recipeId: 9, name: 'Rajma', portions: 20, mealSlot: 'LUNCH', serveTime: '13:00', quantities: [{ ingredientId: 1, name: 'Rajma', perServing: '0.1', required: '2', unit: 'kg' }], guidance }] })
const guide = (values = {}) => ({ id: 2, recipeId: 9, title: 'Guide', owner: 'Lead', method: 'Step one\nStep two', applicability: 'Rajma batch', nextAction: 'Tell lead', version: 3, publishedAt: 'today', contentLanguage: 'hi', availableLanguages: ['hi'], ...values })
const chooseRajma = async user => user.click(await screen.findByRole('button', { name: /Rajma/ }))
beforeEach(() => localStorage.clear())

describe('staff Today', () => {
  it('shows exact server quantities and approved guidance, then records a local question behind Ask manager', async () => {
    const user = userEvent.setup(), post = vi.fn().mockResolvedValue({ id: 1 }), api = { get: vi.fn().mockResolvedValue(dish([guide({ isDemo: true })])), post }
    render(<TodayPanel api={api} initialDate="2026-09-28"/>)
    await chooseRajma(user)
    expect(screen.getByText(/0.1 kg प्रति portion · कुल तय 2 kg/)).toBeInTheDocument()
    expect(screen.getByText(/Step one/)).toBeInTheDocument()
    expect(screen.queryByLabelText('आपका प्रश्न')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'प्रबंधक से पूछें' }))
    await user.type(screen.getByLabelText('आपका प्रश्न'), 'कृपया स्पष्ट करें')
    await user.type(screen.getByLabelText('नाम'), 'रीना')
    await user.click(screen.getByRole('button', { name: 'प्रश्न दर्ज करें' }))
    await waitFor(() => expect(post).toHaveBeenCalledWith('/escalations', expect.objectContaining({ recipeId: 9, date: '2026-09-28', requestKey: expect.any(String) })))
    expect(screen.getByText(/आपका प्रश्न प्रबंधक की स्थानीय सूची में दर्ज हुआ/)).toHaveTextContent(/कोई सूचना बाहर नहीं भेजी गई/)
  })

  it('shows stale guidance without methods and identifies its owner', async () => {
    const user = userEvent.setup(), api = { get: vi.fn().mockResolvedValue(dish([guide({ title: 'Old', owner: 'Kitchen lead', stale: true, reason: 'Recipe changed' })])), post: vi.fn() }
    render(<TodayPanel api={api} initialDate="2026-09-28"/>); await chooseRajma(user)
    expect(screen.getByText(/रेसिपी बदल गई है/)).toBeInTheDocument()
    expect(screen.getByText(/ज़िम्मेदार: Kitchen lead/)).toBeInTheDocument()
    expect(screen.queryByText('Old method')).not.toBeInTheDocument()
  })

  it('groups all three meals, shows saved times, marks legacy dishes, and keeps staff controls read only', async () => {
    const data = dish([])
    data.dishes.push({ ...data.dishes[0], planId: 5, name: 'Poha', mealSlot: 'BREAKFAST', portions: 30, serveTime: '08:00' }, { ...data.dishes[0], planId: 6, name: 'Old curry', mealSlot: 'UNASSIGNED', portions: 120, serveTime: null })
    const api = { get: vi.fn().mockResolvedValue(data), post: vi.fn() }
    render(<TodayPanel api={api} initialDate="2026-09-28"/>)
    expect(await screen.findByRole('heading', { name: 'नाश्ता' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'दोपहर का भोजन' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'रात का भोजन' })).toBeInTheDocument()
    expect(screen.getByText(/08:00/)).toBeInTheDocument(); expect(screen.getByText(/13:00/)).toBeInTheDocument(); expect(screen.getByText(/20:00/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'भोजन तय नहीं' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /120.*प्रबंधक से पूछें/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Edit|Remove/ })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Serving time')).not.toBeInTheDocument()
  })

  it('offers retry after a fetch error and keeps tomorrow as an explicit date navigation', async () => {
    const user = userEvent.setup(), api = { get: vi.fn().mockImplementationOnce(() => Promise.reject(Error('offline'))).mockImplementation(() => Promise.resolve({ date: '2026-09-28', mealTimes, dishes: [] })), post: vi.fn() }
    render(<TodayPanel api={api} initialDate="2026-09-28"/>); await user.click(await screen.findByRole('button', { name: 'फिर कोशिश करें' }))
    expect(await screen.findByRole('heading', { name: 'नाश्ता' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'कल की योजना देखें' }))
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/today?date=2026-09-29&language=hi'))
  })

  it('freezes a pending question and binds retry keys to the captured payload', async () => {
    const user = userEvent.setup(); let rejectFirst; const first = new Promise((_, reject) => { rejectFirst = reject })
    const post = vi.fn().mockImplementationOnce(() => first).mockRejectedValue(Error('offline')), api = { get: vi.fn().mockResolvedValue(dish()), post }
    render(<TodayPanel api={api} initialDate="2026-09-28"/>); await chooseRajma(user); await user.click(screen.getByRole('button', { name: 'प्रबंधक से पूछें' }))
    await user.type(screen.getByLabelText('आपका प्रश्न'), 'पहला प्रश्न'); await user.type(screen.getByLabelText('नाम'), 'रीना'); await user.click(screen.getByRole('button', { name: 'प्रश्न दर्ज करें' }))
    expect(screen.getByLabelText('कार्य तारीख')).toBeDisabled(); expect(screen.getByLabelText('आपका प्रश्न')).toBeDisabled(); expect(screen.getByRole('button', { name: 'व्यंजनों पर वापस जाएँ' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'प्रबंधक से पूछें' })).toBeDisabled()
    await act(async () => { rejectFirst(Error('offline')) }); await waitFor(() => expect(screen.getByRole('button', { name: 'प्रश्न दर्ज करें' })).toBeEnabled())
    const original = post.mock.calls[0][1].requestKey; await user.click(screen.getByRole('button', { name: 'प्रश्न दर्ज करें' })); await waitFor(() => expect(post).toHaveBeenCalledTimes(2)); expect(post.mock.calls[1][1].requestKey).toBe(original)
    await user.type(screen.getByLabelText('आपका प्रश्न'), ' बदला'); await user.click(screen.getByRole('button', { name: 'प्रश्न दर्ज करें' })); await waitFor(() => expect(post).toHaveBeenCalledTimes(3)); expect(post.mock.calls[2][1].requestKey).not.toBe(original)
  })

  it('shows actual Hindi fallback and exact quantities when English is requested', async () => {
    localStorage.setItem('group1-ui-language', 'en')
    const user = userEvent.setup(), api = { get: vi.fn().mockResolvedValue(dish([guide({ title: 'निर्देश', method: 'ध्यान से मिलाएँ', contentLanguage: 'hi', requestedLanguage: 'en', availableLanguages: ['hi'], languageFallback: true, languageContents: { hi: { title: 'निर्देश', method: 'ध्यान से मिलाएँ' } } })])), post: vi.fn() }
    render(<LanguageProvider><TodayPanel api={api} initialDate="2026-09-28"/></LanguageProvider>); await chooseRajma(user)
    expect(screen.getByText(/0.1 kg per portion · fixed total 2 kg/)).toBeInTheDocument()
    expect(screen.getByText(/The published Hindi content is shown below; it has not been translated/)).toBeInTheDocument()
    expect(screen.getByText('ध्यान से मिलाएँ').closest('.guidance-method')).toHaveAttribute('lang', 'hi')
    expect(api.get).toHaveBeenCalledWith('/today?date=2026-09-28&language=en')
  })

  it('renders the requested reviewed English content and suppresses every stale language variant', async () => {
    localStorage.setItem('group1-ui-language', 'en')
    const user = userEvent.setup(), content = guide({ title: 'English guide', contentLanguage: 'en', availableLanguages: ['hi', 'en'], languageContents: { hi: { title: 'Hindi guide', method: 'Hindi method' }, en: { title: 'English guide', method: 'English reviewed method' } }, method: 'English reviewed method', applicability: 'Lunch', nextAction: 'Serve' })
    const api = { get: vi.fn().mockResolvedValue(dish([content])), post: vi.fn() }
    const view = render(<LanguageProvider><TodayPanel api={api} initialDate="2026-09-28"/></LanguageProvider>); await chooseRajma(user)
    expect(screen.getByText('English reviewed method').closest('.guidance-method')).toHaveAttribute('lang', 'en'); expect(screen.queryByText('Hindi method')).not.toBeInTheDocument()
    const staleApi = { get: vi.fn().mockResolvedValue(dish([guide({ id: 3, title: 'Old title', stale: true, languageContents: { hi: { method: 'Hindi secret' }, en: { method: 'English secret' } }, method: 'Hindi secret' })])) }
    view.rerender(<LanguageProvider><TodayPanel api={staleApi} initialDate="2026-09-28"/></LanguageProvider>)
    expect(await screen.findByText(/The recipe changed/)).toBeInTheDocument(); expect(screen.queryByText(/Hindi secret|English secret|Old title/)).not.toBeInTheDocument()
  })

  it('shows each actual approved photo once beside quantities and instructions', async () => {
    const user = userEvent.setup(), photos = [{ id: 101, url: 'data:image/png;base64,AA==', caption: 'Actual pan photo', kind: 'PROCESS' }, { id: 102, url: 'data:image/png;base64,AA==', caption: 'Actual portion photo', kind: 'PORTION' }]
    const api = { get: vi.fn().mockResolvedValue(dish([guide({ id: 1, photos: [] }), guide({ id: 2, photos })])), post: vi.fn() }
    render(<TodayPanel api={api} initialDate="2026-09-28"/>); await chooseRajma(user)
    expect(screen.getAllByRole('img', { name: 'Actual pan photo' })).toHaveLength(1)
    expect(screen.getAllByRole('img', { name: 'Actual portion photo' })).toHaveLength(1)
    expect(screen.getAllByText('Actual pan photo')).toHaveLength(1); expect(screen.getAllByText('Actual portion photo')).toHaveLength(1)
  })
})
