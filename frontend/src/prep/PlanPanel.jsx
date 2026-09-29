import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from './language'
import { filterRecipes, matchesRecipeName } from './recipeSearch'
import { scaleDecimalByInteger } from './stockMetrics'
import { kitchenDate } from './api'

const SLOTS = ['BREAKFAST', 'LUNCH', 'DINNER']
const PORTIONS = [30, 40, 50, 60, 70, 80, 90, 100]
const pad = value => String(value).padStart(2, '0')
function parseDate(value) { const [year, month, day] = value.split('-').map(Number); return new Date(Date.UTC(year, month - 1, day)) }
function formatDate(date) { return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` }
function validDate(value) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false; return formatDate(parseDate(value)) === value }
function shiftDate(value, days) { const date = parseDate(value); date.setUTCDate(date.getUTCDate() + days); return formatDate(date) }
function mondayOf(value) { const date = parseDate(value); date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7); return formatDate(date) }
const emptyRecipe = () => ({ name: '', ingredients: [{ ingredientId: '', quantity: '', unit: 'kg' }] })

export default function PlanPanel({ items, planDate, api, mutate, saving, reportError, onDraftSaved, view = 'menu', onDateChange, onBusyChange, onSummaryChange, quickPick, onQuickPickConsumed }) {
  const { language, t } = useLanguage()
  const [weekStart, setWeekStart] = useState(() => mondayOf(planDate))
  const [days, setDays] = useState([])
  const [calendarLoading, setCalendarLoading] = useState(true)
  const [calendarError, setCalendarError] = useState('')
  const [recipes, setRecipes] = useState([])
  const [estimate, setEstimate] = useState(null)
  const [estimateDate, setEstimateDate] = useState('')
  const [dayLoading, setDayLoading] = useState(true)
  const [recipeForm, setRecipeForm] = useState(null)
  const [planForm, setPlanForm] = useState(null)
  const [recipeSearch, setRecipeSearch] = useState('')
  const [overrides, setOverrides] = useState({})
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID())
  const [localBusy, setLocalBusy] = useState(false)
  const [timeValues, setTimeValues] = useState({})
  const [timeBusy, setTimeBusy] = useState('')
  const [timeError, setTimeError] = useState('')
  const requestSequence = useRef(0)
  const dateSequence = useRef(0)
  const previousDate = useRef(planDate)
  const planFormRef = useRef(null)
  const returnFocus = useRef(null)
  const focusFormPending = useRef(false)
  const busy = saving || localBusy || Boolean(timeBusy)
  const selected = days.find(day => day.date === planDate)
  const selectedReady = Boolean(selected && estimateDate === planDate && !dayLoading && !calendarLoading)
  useEffect(() => { onBusyChange?.(busy) }, [busy, onBusyChange])
  useEffect(() => () => onBusyChange?.(false), [onBusyChange])
  useEffect(() => { onSummaryChange?.({ date: planDate, plannedEntries: selectedReady ? selected?.plans?.length || 0 : null, shortageCount: selectedReady ? (estimate?.lines || []).filter(line => Number(line.suggested) > 0).length : null, state: selectedReady ? 'ready' : dayLoading || calendarLoading ? 'loading' : 'unavailable' }) }, [planDate, selectedReady, selected, estimate, dayLoading, calendarLoading, onSummaryChange])
  useEffect(() => { if (quickPick && recipes.some(recipe => String(recipe.id) === String(quickPick.id)) && !busy) { setRecipeSearch(''); focusFormPending.current = true; setPlanForm({ recipeId: String(quickPick.id), portions: '50', mealSlot: 'UNASSIGNED' }); onQuickPickConsumed?.() } }, [quickPick, recipes, busy, onQuickPickConsumed])
  useEffect(() => {
    if (planForm && focusFormPending.current) {
      focusFormPending.current = false
      planFormRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
      planFormRef.current?.querySelector('select')?.focus()
    }
  }, [planForm])

  const loadWeek = useCallback(async (start = weekStart) => {
    const sequence = ++requestSequence.current
    setCalendarLoading(true); setCalendarError(''); setDays([])
    try {
      const result = await api.get(`/calendar?start=${start}`)
      if (sequence === requestSequence.current) setDays(result.days || [])
    } catch (error) { if (sequence === requestSequence.current) { setDays([]); setCalendarError(error.message); reportError(error) } }
    finally { if (sequence === requestSequence.current) setCalendarLoading(false) }
  }, [api, reportError, weekStart])
  useEffect(() => { loadWeek() }, [loadWeek])
  useEffect(() => {
    if (previousDate.current !== planDate) {
      previousDate.current = planDate
      setWeekStart(mondayOf(planDate))
      setTimeValues({})
      setPlanForm(null)
      setRecipeForm(null)
    }
  }, [planDate])

  const loadDay = useCallback(async () => {
    if (!planDate) return
    const sequence = ++dateSequence.current
    setDayLoading(true); setEstimate(null); setEstimateDate('')
    try {
      const [r, e] = await Promise.all([api.get('/recipes'), api.get(`/estimate?date=${planDate}`)])
      if (sequence === dateSequence.current) { setRecipes(r); setEstimate(e); setEstimateDate(planDate); setOverrides({}); setRequestKey(crypto.randomUUID()) }
    } catch (error) { if (sequence === dateSequence.current) reportError(error) }
    finally { if (sequence === dateSequence.current) setDayLoading(false) }
  }, [api, planDate, reportError])
  useEffect(() => { loadDay() }, [loadDay, items])

  async function reloadCurrent() { await Promise.all([loadWeek(weekStart), loadDay()]) }
  async function change(operation, message) {
    setLocalBusy(true)
    try { const result = await mutate(operation, message); if (result) { await reloadCurrent() } return result }
    finally { setLocalBusy(false) }
  }
  async function saveRecipe(event) { event.preventDefault(); if (await change(() => recipeForm.id ? api.put(`/recipes/${recipeForm.id}`, recipeForm) : api.post('/recipes', recipeForm), {key:'support.dishSaved'})) setRecipeForm(null) }
  async function savePlan(event) { event.preventDefault(); const { legacyPortions, ...payload } = planForm; const normalizedPayload = { ...payload, recipeId: Number(payload.recipeId), date: planDate, portions: Number(planForm.portions) }; if (await change(() => planForm.id ? api.put(`/plans/${planForm.id}`, normalizedPayload) : api.post('/plans', normalizedPayload), {key:'support.planSaved'})) setPlanForm(null) }
  function adjustPortions(delta) { setPlanForm(current => { const value = Number(current?.portions) || 1; return { ...current, portions: String(Math.max(1, Math.min(100000, value + delta))) } }) }
  async function saveTime(slot) {
    const serveTime = timeValues[slot] ?? selected?.mealTimes?.[slot] ?? ''
    setTimeBusy(slot); setTimeError('')
    try { await api.put('/meal-times', { date: planDate, mealSlot: slot, serveTime }); await reloadCurrent(); setTimeValues(values => { const next = { ...values }; delete next[slot]; return next }) }
    catch (error) { setTimeError(error.message) }
    finally { setTimeBusy('') }
  }
  function chooseDate(date) { if (!busy && validDate(date) && date !== planDate) { setTimeValues({}); setPlanForm(null); setRecipeForm(null); onDateChange(date) } }
  function openPlanForm(form, event) { returnFocus.current = event.currentTarget; focusFormPending.current = true; setRecipeSearch(''); setPlanForm(form) }
  function openScalePreview(event) { returnFocus.current = event.currentTarget; focusFormPending.current = true; setRecipeSearch(''); setPlanForm({ scaleOnly: true, recipeId: String(recipes[0]?.id || ''), portions: '350', mealSlot: 'UNASSIGNED' }) }
  function closePlanForm() { setPlanForm(null); setRecipeSearch(''); returnFocus.current?.focus() }
  function lineChange(index, key, value) { setRecipeForm({ ...recipeForm, ingredients: recipeForm.ingredients.map((line, i) => i !== index ? line : key === 'ingredientId' ? { ...line, ingredientId: value, unit: items.find(item => String(item.id) === value)?.unit || 'kg' } : { ...line, [key]: value }) }) }
  async function saveDraft(event) {
    event.preventDefault()
    const result = await mutate(() => api.post('/drafts', { date: planDate, fingerprint: estimate.fingerprint, overrides: estimate.lines.map(line => ({ ingredientId: line.ingredientId, quantity: overrides[line.ingredientId] ?? line.suggested })), requestKey }), {key:'support.draftSaved'})
    if (result) { setRequestKey(crypto.randomUUID()); onDraftSaved() }
  }
  const dayLabel = date => new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(parseDate(date))
  const fullDayLabel = date => new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(parseDate(date))
  const mealLabel = slot => t(`plan.${slot.toLowerCase()}`)

  return <section className="planner">
    <div className="section-heading"><div><p className="eyebrow">{t('plan.eyebrow')}</p><h1>{view === 'menu' ? t('plan.title') : view === 'ingredients' ? t('plan.ingredients') : t('plan.dishes')}</h1><p>{view === 'menu' ? t('plan.intro') : t('plan.scopeDate', { date: planDate })}</p></div></div>
    {view === 'menu' && <>
      <div className="calendar-toolbar" aria-label={t('plan.calendar')}><button type="button" className="button secondary" disabled={busy} onClick={() => { const date = shiftDate(planDate, -7); setWeekStart(mondayOf(date)); chooseDate(date) }}>{t('plan.previousWeek')}</button><button type="button" className="button secondary" disabled={busy} onClick={() => { const today = kitchenDate(); setWeekStart(mondayOf(today)); chooseDate(today) }}>{t('plan.thisWeek')}</button><button type="button" className="button secondary" disabled={busy} onClick={() => { const date = shiftDate(planDate, 7); setWeekStart(mondayOf(date)); chooseDate(date) }}>{t('plan.nextWeek')}</button><label className="weekday-picker">{t('plan.weekdayView')}<select aria-label={t('plan.weekdayView')} value={planDate===kitchenDate()?'__this-week__':planDate} disabled={busy||calendarLoading} onChange={event=>{if(event.target.value==='__this-week__'){const today=kitchenDate();setWeekStart(mondayOf(today));chooseDate(today)}else chooseDate(event.target.value)}}><option value="__this-week__">{t('plan.thisWeek')}</option>{days.map(day=><option key={day.date} value={day.date}>{t('plan.weekdayOption',{day:fullDayLabel(day.date),count:day.plans?.length||0})}</option>)}</select></label><label>{t('plan.chooseDate')}<input aria-label={t('plan.chooseDate')} type="date" value={planDate} disabled={busy} onChange={event => { const date = event.target.value; if (validDate(date)) { setWeekStart(mondayOf(date)); chooseDate(date) } }}/></label><button type="button" className="button scale-launch" disabled={busy||!recipes.length} onClick={openScalePreview}>{t('plan.startScale')}</button></div>
      {calendarError ? <p className="alert error" role="alert">{t('plan.calendarFailed', { error: calendarError })}<button type="button" className="text-button" onClick={() => loadWeek()}>{t('today.retry')}</button></p> : <div className="weekday-strip" role="group" aria-label={t('plan.calendar')}>{days.map(day => <button type="button" key={day.date} aria-label={t('plan.dayAria', { day: dayLabel(day.date), count: day.plans?.length || 0 })} aria-pressed={day.date === planDate} className={`weekday-card${day.date === planDate ? ' selected' : ''}`} onClick={() => chooseDate(day.date)}><span>{dayLabel(day.date)}</span><small>{t('plan.dishCount', { count: day.plans?.length || 0 })}</small></button>)}</div>}
      <h2 className="selected-date">{validDate(planDate) ? dayLabel(planDate) : ''} <span>{planDate}</span></h2>
      {dayLoading && <p className="muted" role="status">{t('plan.loadingDate')}</p>}
      {SLOTS.map(slot => {
        const plans = (selected?.plans || []).filter(plan => (plan.mealSlot || 'UNASSIGNED') === slot)
        const time = timeValues[slot] ?? selected?.mealTimes?.[slot] ?? ''
        return <section className="meal-card" key={slot} aria-labelledby={`meal-${slot}`}><header className="meal-heading"><div><h2 id={`meal-${slot}`}>{mealLabel(slot)}</h2><p className="muted">{selectedReady ? plans.length ? t('plan.mealCount', { count: plans.length }) : t('plan.emptyMeal') : t('plan.loadingDate')}</p></div><div className="meal-time"><label>{t('plan.serveTime')}<input aria-label={`${t('plan.serveTime')} · ${mealLabel(slot)}`} type="time" value={time} disabled={busy || !selectedReady} onChange={event => setTimeValues(values => ({ ...values, [slot]: event.target.value }))}/></label><button type="button" className="text-button" disabled={busy || !selectedReady || !time || time === selected?.mealTimes?.[slot]} onClick={() => saveTime(slot)}>{timeBusy === slot ? t('plan.saving') : t('plan.saveTime')}</button></div></header>
          {selectedReady && plans.map(plan => <div className="planned-dish" key={plan.id}><div><strong>{plan.name || recipes.find(recipe => recipe.id === plan.recipeId)?.name}</strong><small>{plan.portions} {t('plan.portions')} · {plan.serveTime || time}</small></div><button type="button" className="text-button" disabled={busy || !selectedReady} onClick={event => openPlanForm({ ...plan, recipeId: String(plan.recipeId), portions: String(plan.portions), legacyPortions: Number(plan.portions), mealSlot: plan.mealSlot || 'UNASSIGNED' }, event)}>{t('plan.edit')}</button><button type="button" className="text-button" disabled={busy || !selectedReady} onClick={() => change(() => api.remove(`/plans/${plan.id}`), {key:'support.planRemoved'})}>{t('plan.remove')}</button></div>)}
          {!plans.length && <p className="meal-empty">{t('plan.emptyNext')}</p>}
          <button type="button" className="button secondary" disabled={!selectedReady || !recipes.length || busy} onClick={event => openPlanForm({ recipeId: String(recipes[0]?.id || ''), portions: '50', mealSlot: slot }, event)}>{t('plan.addDish')}</button>
        </section>
      })}
      {selectedReady && Boolean(selected?.plans?.some(plan => !SLOTS.includes(plan.mealSlot))) && <section className="meal-card"><h2>{t('plan.unassigned')}</h2>{selected.plans.filter(plan => !SLOTS.includes(plan.mealSlot)).map(plan => <div className="planned-dish" key={plan.id}><div><strong>{plan.name}</strong><small>{plan.portions} {t('plan.portions')}</small></div><button type="button" className="text-button" disabled={busy || !selectedReady} onClick={event => openPlanForm({ ...plan, recipeId: String(plan.recipeId), portions: String(plan.portions), legacyPortions: Number(plan.portions), mealSlot: 'UNASSIGNED' }, event)}>{t('plan.edit')}</button><button type="button" className="text-button" disabled={busy || !selectedReady} onClick={() => change(() => api.remove(`/plans/${plan.id}`), {key:'support.planRemoved'})}>{t('plan.remove')}</button></div>)}</section>}
    </>}
    {timeError && <p className="alert error" role="alert">{timeError}</p>}
    {planForm && <form ref={planFormRef} className="panel form-grid plan-editor" onSubmit={event=>{if(!planForm.scaleOnly)savePlan(event);else event.preventDefault()}}><h2 className="full">{planForm.scaleOnly?t('plan.scalePreview'):planForm.id?t('plan.editDish'):t('plan.addDish')} · {planDate}</h2><label className="full">{t('plan.searchDish')}<input type="search" value={recipeSearch} onChange={event => setRecipeSearch(event.target.value)} disabled={busy} autoComplete="off"/></label><label>{t('plan.dish')}<select required disabled={busy} value={planForm.recipeId} onChange={event => setPlanForm({ ...planForm, recipeId: event.target.value })}>{filterRecipes(recipes, recipeSearch, planForm.recipeId).map(recipe => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}</select>{recipeSearch.trim() && !recipes.some(recipe => matchesRecipeName(recipe, recipeSearch)) && <small className="muted" role="status">{t('plan.noRecipeMatch')}</small>}</label><div className="cover-field"><label htmlFor="covers-presets">{t('plan.portionsLabel')}</label><select id="covers-presets" aria-label={t('plan.portionsLabel')} required disabled={busy} value={PORTIONS.includes(Number(planForm.portions))?String(planForm.portions):planForm.legacyPortions&&Number(planForm.portions)===planForm.legacyPortions?String(planForm.legacyPortions):'custom'} onChange={event => { if(event.target.value!=='custom') setPlanForm({ ...planForm, portions: event.target.value }) }}><option value="custom">{t('plan.customCovers')}</option>{PORTIONS.map(value => <option key={value} value={value}>{value}</option>)}{planForm.legacyPortions && !PORTIONS.includes(planForm.legacyPortions) && <option value={planForm.legacyPortions}>{t('plan.existingPortions', { count: planForm.legacyPortions })}</option>}</select><div className="cover-control"><button type="button" aria-label={t('plan.decreaseCovers')} disabled={busy||Number(planForm.portions)<=1} onClick={() => adjustPortions(-1)}><span aria-hidden="true">−</span></button><label className="cover-number-label" htmlFor="covers-input">{t('plan.customCovers')}<input id="covers-input" aria-label={t('plan.customCovers')} list="cover-presets-list" required disabled={busy} type="number" min="1" max="100000" step="1" value={planForm.portions} aria-describedby="covers-help" onChange={event => setPlanForm({ ...planForm, portions: event.target.value })}/></label><button type="button" aria-label={t('plan.increaseCovers')} disabled={busy||Number(planForm.portions)>=100000} onClick={() => adjustPortions(1)}><span aria-hidden="true">+</span></button></div><datalist id="cover-presets-list">{PORTIONS.map(value=><option key={value} value={value}/>)}</datalist><small id="covers-help" className="muted">{t('plan.coverLimit')}</small></div>{!planForm.scaleOnly&&<label>{t('plan.meal')}<select aria-label={t('plan.meal')} disabled={busy} value={planForm.mealSlot} onChange={event => setPlanForm({ ...planForm, mealSlot: event.target.value })}><option value="UNASSIGNED">{t('plan.unassigned')}</option>{SLOTS.map(slot => <option key={slot} value={slot}>{mealLabel(slot)}</option>)}</select></label>}{recipes.find(recipe=>String(recipe.id)===String(planForm.recipeId))?.ingredients?.length>0&&<section className="portion-preview full" aria-label={t('plan.scalePreview')}><div><div><span className="eyebrow">{t('plan.scalePreview')}</span><h3>{recipes.find(recipe=>String(recipe.id)===String(planForm.recipeId)).name} · {planForm.portions} {t('plan.portions')}</h3></div><span className="preview-only">{t('plan.previewOnly')}</span></div><p className="muted">{t('plan.previewOnlyNote')}</p><ul>{recipes.find(recipe=>String(recipe.id)===String(planForm.recipeId)).ingredients.map(line=><li key={line.ingredientId||line.id}><span>{line.name}</span><span className="tabular-nums">{line.quantity} × {planForm.portions} = <strong>{scaleDecimalByInteger(line.quantity,Number(planForm.portions)) ?? '—'} {line.unit}</strong></span></li>)}</ul></section>}<div className="full form-footer">{planForm.scaleOnly?<button type="button" className="button secondary" disabled={busy} onClick={closePlanForm}>{t('plan.closePreview')}</button>:<><button className="button" disabled={busy||!Number.isInteger(Number(planForm.portions))||Number(planForm.portions)<1||Number(planForm.portions)>100000}>{t('plan.saveDish')}</button><button type="button" className="text-button" disabled={busy} onClick={closePlanForm}>{t('plan.cancel')}</button></>}</div></form>}
    {view === 'dishes' && <><div className="actions"><button className="button" disabled={!items.length || busy} onClick={() => setRecipeForm(emptyRecipe())}>{t('plan.createDish')}</button></div><div className="panel">{!recipes.length && <p className="muted">{t('plan.noDishes')}</p>}{recipes.map(recipe => <div className="planned-dish" key={recipe.id}><div><strong>{recipe.name}</strong><small>{recipe.ingredients.length} {t('plan.ingredientsCount')}</small></div><button type="button" className="text-button" disabled={busy} onClick={() => setRecipeForm({ ...recipe, ingredients: recipe.ingredients.map(line => ({ ...line, ingredientId: String(line.ingredientId) })) })}>{t('plan.editDish')}</button><button type="button" className="text-button" disabled={busy} onClick={() => change(() => api.remove(`/recipes/${recipe.id}`), {key:'support.dishArchived'})}>{t('plan.archive')}</button></div>)}</div></>}
    {recipeForm && <form className="panel form-grid" onSubmit={saveRecipe}><h2 className="full">{recipeForm.id ? t('plan.editDish') : t('plan.createDish')}</h2><label className="full">{t('plan.dishName')}<input required disabled={busy} maxLength={120} value={recipeForm.name} onChange={event => setRecipeForm({ ...recipeForm, name: event.target.value })}/></label><p className="muted full">{t('plan.perServing')}</p>{recipeForm.ingredients.map((line, index) => <div className="full recipe-row" key={index}><label>{t('plan.ingredient')} {index + 1}<select required disabled={busy} value={line.ingredientId} onChange={event => lineChange(index, 'ingredientId', event.target.value)}><option value="">{t('plan.chooseIngredient')}</option>{items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>{t('plan.quantity')}<input required disabled={busy} type="number" min="0.000001" step="any" value={line.quantity} onChange={event => lineChange(index, 'quantity', event.target.value)}/></label><label>{t('plan.unit')}<select disabled={busy} value={line.unit} onChange={event => lineChange(index, 'unit', event.target.value)}>{['kg', 'g', 'L', 'ml', 'count'].map(unit => <option key={unit}>{unit}</option>)}</select></label><button type="button" className="text-button" aria-label={t('plan.removeIngredient', { count: index + 1 })} disabled={busy || recipeForm.ingredients.length === 1} onClick={() => setRecipeForm({ ...recipeForm, ingredients: recipeForm.ingredients.filter((_, i) => i !== index) })}>×</button></div>)}<div className="full"><button type="button" className="text-button" disabled={busy || recipeForm.ingredients.length >= 50} onClick={() => setRecipeForm({ ...recipeForm, ingredients: [...recipeForm.ingredients, { ingredientId: '', quantity: '', unit: 'kg' }] })}>{t('plan.addIngredient')}</button></div><div className="full form-footer"><button className="button" disabled={busy}>{t('plan.saveRecipe')}</button><button type="button" className="text-button" disabled={busy} onClick={() => setRecipeForm(null)}>{t('plan.cancel')}</button></div></form>}
    {view === 'ingredients' && <>{estimate?.lines.length ? <><div className="panel"><h2>{t('plan.requirements')}</h2><p className="muted">{t('plan.requirementsNote', { date: planDate })}</p><div className="table-wrap"><table><thead><tr>{['plan.colIngredient','plan.colRequired','plan.colOnHand','plan.colExcluded','plan.colUsable','plan.colBuffer','plan.colBuy'].map(key => <th key={key}>{t(key)}</th>)}</tr></thead><tbody>{estimate.lines.map(line => <tr key={line.ingredientId} data-testid={`estimate-${line.name}`}><td>{line.name} ({line.unit})</td>{['required', 'onHand', 'excluded', 'usable', 'buffer', 'suggested'].map(key => <td key={key} data-testid={key}>{line[key]}</td>)}</tr>)}</tbody></table></div></div>{estimate.lines.map(line => <details className="panel support-disclosure" key={line.ingredientId}><summary>{line.name} · {t('plan.mathDetails')}</summary><div><h3>{t('plan.arithmetic')}</h3>{line.breakdown.map((b, index) => <p className="arithmetic" key={index}>{b.dish}: {b.portions} × {b.perServing} {line.unit} = {b.required} {line.unit}</p>)}<p className="arithmetic">max(0, {line.required} {t('support.required')} + {line.buffer} {t('support.buffer').toLowerCase()} − {line.usable} {t('plan.colUsable').toLowerCase()}) = {line.rawSuggestion} {line.unit}{Number(line.increment) > 0 ? t('plan.roundedInSteps',{count:line.increment,suggested:line.suggested,unit:line.unit}) : ''}</p>{line.reviewLots.map(lot => <p className="muted small" key={lot.lotId}>Lot #{lot.lotId}: {lot.quantity} {line.unit} · {lot.labelDate || t('plan.unknownDate')} · {lot.excluded ? t('plan.excluded') : t('plan.review')}</p>)}<Settings key={`${estimate.fingerprint}-${line.ingredientId}`} line={line} date={planDate} save={body => change(() => api.put(`/planning-settings/${line.ingredientId}`, body), {key:'support.settingsSaved'})} saving={busy}/></div></details>)}<details className="panel accent-panel support-disclosure"><summary>{t('plan.purchaseAction')}</summary><form onSubmit={saveDraft}><h2>{t('plan.buyDraft')}</h2><p className="muted">{t('plan.buyDraftNote')}</p><div className="table-wrap"><table><thead><tr><th>{t('plan.ingredient')}</th><th>{t('plan.suggested')}</th><th>{t('plan.draftQuantity')}</th></tr></thead><tbody>{estimate.lines.map(line => <tr key={line.ingredientId}><td>{line.name} ({line.unit})</td><td>{line.suggested}</td><td><input aria-label={t('plan.draftFor', { name: line.name })} disabled={busy} required type="number" min="0" step="any" value={overrides[line.ingredientId] ?? line.suggested} onChange={event => setOverrides({ ...overrides, [line.ingredientId]: event.target.value })}/></td></tr>)}</tbody></table></div><button className="button" disabled={busy}>{t('plan.saveDraft')}</button></form></details></> : <p className="panel">{t('plan.noRequirements')}</p>}</>}
  </section>
}
function Settings({ line, date, save, saving }) {
  const { t } = useLanguage()
  const [buffer, setBuffer] = useState(line.buffer)
  const [increment, setIncrement] = useState(line.increment)
  return <form className="form-grid" onSubmit={event => { event.preventDefault(); save({ date, buffer, increment, unit: line.unit }) }}><label>{t('plan.bufferFor', { name: line.name })}<input required disabled={saving} type="number" min="0" step="any" value={buffer} onChange={event => setBuffer(event.target.value)}/></label><label>{t('plan.incrementFor', { name: line.name })}<input required disabled={saving} type="number" min="0" step="any" value={increment} onChange={event => setIncrement(event.target.value)}/></label><div className="full form-footer"><button className="button secondary" disabled={saving}>{t('plan.applySettings', { name: line.name })}</button><span className="muted">{t('plan.settingsHelp')}</span></div></form>
}
