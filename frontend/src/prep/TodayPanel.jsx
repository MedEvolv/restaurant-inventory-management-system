import { useEffect, useRef, useState } from 'react'
import GuidancePhoto from './GuidancePhoto'
import HindiPlayback from './HindiPlayback'
import { useLanguage } from './language'
import { kitchenDate } from './api'

const MEALS = ['BREAKFAST', 'LUNCH', 'DINNER']
const plusDay = value => { const [y, m, d] = value.split('-').map(Number); const date = new Date(Date.UTC(y, m - 1, d + 1)); return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}` }
export default function TodayPanel({ api, initialDate, onPlanDate, onBusyChange, onDateChange }) {
  const { language, t } = useLanguage()
  const [date, setDate] = useState(initialDate || kitchenDate())
  const [retry, setRetry] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [question, setQuestion] = useState('')
  const [reporter, setReporter] = useState('')
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [askOpen, setAskOpen] = useState(false)
  const key = useRef(crypto.randomUUID())
  const keySignature = useRef(null)
  const sequence = useRef(0)
  const priorRequest = useRef(null)
  useEffect(() => { onBusyChange?.(pending) }, [pending, onBusyChange])
  useEffect(() => { setDate(initialDate) }, [initialDate])
  useEffect(() => {
    let active = true
    const id = ++sequence.current
    const scope = `${date}:${retry}`
    if (priorRequest.current !== null && priorRequest.current !== scope) { setSelected(null); setFeedback(''); setAskOpen(false) }
    priorRequest.current = scope
    setLoading(true); setError('')
    api.get(`/today?date=${date}&language=${language}`).then(value => { if (active && id === sequence.current) setData(value) }).catch(value => { if (active && id === sequence.current) setError(value.message) }).finally(() => { if (active && id === sequence.current) setLoading(false) })
    return () => { active = false }
  }, [api, date, retry, language])

  const allDishes = data?.dishes || []
  const chosen = allDishes.find(dish => String(dish.planId) === String(selected))
  const missingOrStale = chosen && !chosen.guidance?.some(guide => !guide.stale)
  const detailPhotos = chosen?.guidance?.filter(guide => !guide.stale).flatMap(guide => guide.photos || []) || []
  const heroPhoto = detailPhotos[0]
  const safeDate = date || kitchenDate()
  const dayLabel = new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${safeDate}T00:00:00Z`))
  async function submit(event) {
    event.preventDefault()
    const payload = { recipeId: Number(chosen.recipeId), date, question: question.trim(), reportedBy: reporter.trim() }
    const signature = JSON.stringify(payload)
    if (keySignature.current !== signature) { key.current = crypto.randomUUID(); keySignature.current = signature }
    setPending(true); setFeedback('')
    try { await api.post('/escalations', { ...payload, requestKey: key.current }); key.current = crypto.randomUUID(); keySignature.current = null; setQuestion(''); setReporter(''); setFeedback({ key: 'today.sent' }) }
    catch (value) { setFeedback({ key: 'today.failedPost', values: { error: value.message } }) }
    finally { setPending(false) }
  }
  function openDish(dish) { setSelected(dish.planId); setAskOpen(false); setFeedback('') }
  function status(dish) { return dish.guidance?.some(guide => !guide.stale) ? t('today.instructionsReady') : dish.guidance?.some(guide => guide.stale) ? t('today.needsReview') : t('today.askManagerStatus') }

  return <section className="today-panel"><div className="section-heading"><div><p className="eyebrow">{t('today.eyebrow')}</p><h1>{t('today.title')}</h1><p>{dayLabel} · {t('today.intro')}</p></div><label>{t('today.date')}<input aria-label={t('today.date')} required disabled={pending} type="date" value={date} onChange={event => { setDate(event.target.value); onDateChange?.(event.target.value) }}/></label></div>
    {loading ? <p className="panel" role="status">{t('today.loading')}</p> : error ? <div className="alert error" role="alert">{t('today.failed')}: {error}<button className="text-button" onClick={() => setRetry(value => value + 1)}>{t('today.retry')}</button></div> : chosen ? <><button type="button" className="text-button" disabled={pending} onClick={() => { setSelected(null); setAskOpen(false); setFeedback('') }}>{t('today.back')}</button><article className="panel dish-detail"><div className="dish-heading"><h2>{chosen.name}</h2><span className="portion-count">{chosen.portions} {t('today.portions')}</span></div><p className="status-line">{status(chosen)}{chosen.guidance?.some(guide => guide.isDemo) && <span className="badge review">{t('today.demoContent')}</span>}</p>
      <div className="dish-instructions-layout">{heroPhoto && <GuidancePhoto photo={heroPhoto}/>}<div className="dish-instructions"><h3>{t('today.quantities')}</h3><div className="quantity-list">{chosen.quantities?.map(quantity => <p key={quantity.ingredientId}><strong>{quantity.name}</strong><br/>{quantity.perServing} {quantity.unit} {t('today.per')} · {t('today.total')} {quantity.required} {quantity.unit}</p>)}</div>{chosen.guidance?.map(guide => <Guidance key={guide.id} guide={guide} interfaceLanguage={language} excludedPhotoId={heroPhoto?.id}/>)}</div></div>
      {missingOrStale && <p className="badge review guidance-warning" role="status">{t(chosen.guidance?.some(guide => guide.stale) ? 'today.staleWarning' : 'today.missingWarning')}</p>}
      <button type="button" className="button secondary ask-toggle" aria-expanded={askOpen} disabled={pending} onClick={() => setAskOpen(value => !value)}>{t('today.askManager')}</button>
      {askOpen && <form className="panel form-grid" onSubmit={submit}><h3 className="full">{t('today.questionTitle')}</h3><label className="full">{t('today.question')}<textarea required disabled={pending} minLength="3" maxLength="2000" value={question} onChange={event => setQuestion(event.target.value)}/></label><label>{t('today.name')}<input required disabled={pending} maxLength="120" value={reporter} onChange={event => setReporter(event.target.value)}/></label><button className="button" disabled={pending}>{t('today.submit')}</button>{feedback && <p role="status" className="full">{t(feedback.key, feedback.values)}</p>}<p className="muted full">{t('today.local')}</p></form>}</article></> : <>
      {MEALS.map(slot => { const dishes = allDishes.filter(dish => dish.mealSlot === slot); const time = data?.mealTimes?.[slot] || ''; return <section className="today-meal" key={slot} aria-labelledby={`today-${slot}`}><header><div><h2 id={`today-${slot}`}>{t(`plan.${slot.toLowerCase()}`)}</h2><p>{time ? `${t('today.servesAt')} ${time}` : t('today.noTime')}</p></div></header>{dishes.length ? <div className="today-dish-list">{dishes.map(dish => { const photo = dish.guidance?.find(guide => !guide.stale && guide.photos?.length)?.photos?.[0]; return <button type="button" key={dish.planId} className="panel today-dish-card" disabled={pending} onClick={() => openDish(dish)}>{photo && <span className="today-card-photo"><GuidancePhoto photo={photo}/></span>}<span className="today-dish-text"><strong>{dish.name}</strong><small>{dish.portions} {t('today.portions')}</small></span><span className={`badge ${status(dish) !== t('today.instructionsReady') ? 'review' : ''}`}>{status(dish)}</span></button> })}</div> : <p className="muted">{t('today.emptyMeal')}</p>}</section> })}
      {allDishes.some(dish => !MEALS.includes(dish.mealSlot)) && <section className="today-meal"><h2>{t('plan.unassigned')}</h2>{allDishes.filter(dish => !MEALS.includes(dish.mealSlot)).map(dish => { const photo = dish.guidance?.find(guide => !guide.stale && guide.photos?.length)?.photos?.[0]; return <button type="button" key={dish.planId} className="panel today-dish-card" onClick={() => openDish(dish)}>{photo && <span className="today-card-photo"><GuidancePhoto photo={photo}/></span>}<span className="today-dish-text"><strong>{dish.name}</strong><small>{dish.portions} {t('today.portions')}</small></span><span className="badge review">{status(dish)}</span></button> })}</section>}
      {!allDishes.length && <div className="panel empty"><p>{t('today.none')}</p><button type="button" className="button secondary" onClick={() => { const next = plusDay(safeDate); setDate(next); onDateChange?.(next) }}>{t('today.tomorrow')}</button>{onPlanDate && <button type="button" className="button" onClick={() => onPlanDate(safeDate)}>{t('today.openPlanner')}</button>}</div>}
    </>}
  </section>
}
function Guidance({ guide, interfaceLanguage, excludedPhotoId }) {
  const { t } = useLanguage()
  const g = guide
  if (g.stale) return <div className="panel alert error stale-guidance"><h3>{t('today.staleTitle')}</h3><p>{t('today.staleBody')}</p><p>{t('today.ownerLabel')}: {g.owner || t('today.ownerUnknown')}. {t('today.escalate')}</p></div>
  const contentLanguage = g.contentLanguage || 'hi'
  const contents = g.languageContents && typeof g.languageContents === 'object' ? g.languageContents : { hi: { title: g.title, method: g.method, handling: g.handling, substitutions: g.substitutions, portionNote: g.portionNote, applicability: g.applicability, nextAction: g.nextAction } }
  const content = contents[contentLanguage] || { title: g.title, method: g.method, handling: g.handling, substitutions: g.substitutions, portionNote: g.portionNote, applicability: g.applicability, nextAction: g.nextAction }
  const available = Array.isArray(g.availableLanguages) ? g.availableLanguages : ['hi']
  const fallback = g.languageFallback ?? (contentLanguage !== interfaceLanguage)
  const spoken = [content.method, content.handling, content.substitutions, content.portionNote, content.applicability, content.nextAction].filter(Boolean).join('. ')
  const langName = contentLanguage === 'en' ? 'English' : interfaceLanguage === 'en' ? 'Hindi' : 'हिन्दी'
  return <article className="published-guidance"><div className="published-title"><h3 lang={contentLanguage}>{content.title || g.title}</h3></div><p className="muted">{t('today.owner', { owner: g.owner || '', version: g.version || '', date: g.publishedAt || '' })}</p><p className="muted small">{t('today.language')}: {langName} · {t('today.available')}: {available.map(value => value === 'en' ? 'English' : interfaceLanguage === 'en' ? 'Hindi' : 'हिन्दी').join(', ') || '—'}</p>{fallback && <p className="badge review" role="status">{t('today.fallback', { language: langName, route: t('today.escalate') })}</p>}{content.applicability && <p className="guidance-scope" lang={contentLanguage}><strong>{t('today.scope')}:</strong> {content.applicability}</p>}{content.method && <div className="guidance-method" lang={contentLanguage}><h4>{t('today.method')}</h4><p className="note-text">{content.method}</p></div>}{content.handling && <p lang={contentLanguage}><strong>{t('today.handling')}:</strong> {content.handling}</p>}{content.substitutions && <p lang={contentLanguage}><strong>{t('today.substitutions')}:</strong> {content.substitutions}</p>}{content.portionNote && <p lang={contentLanguage}><strong>{t('today.portionNote')}:</strong> {content.portionNote}</p>}{content.nextAction && <p lang={contentLanguage}><strong>{t('today.next')}:</strong> {content.nextAction}</p>}{g.sourceReference && <p><strong>{t('today.source')}:</strong> {g.sourceReference}</p>}{g.photos?.filter(photo => photo.id !== excludedPhotoId).map(photo => <GuidancePhoto key={photo.id} photo={photo}/>)}{spoken && <HindiPlayback text={spoken} contentLanguage={contentLanguage} interfaceLanguage={interfaceLanguage}/>}</article>
}
