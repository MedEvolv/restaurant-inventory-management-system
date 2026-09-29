import { useEffect, useState } from 'react'
import { AlertTriangle, BookOpen, CircleHelp, ClipboardList, ShoppingCart, Users, Wallet } from 'lucide-react'
import { useLanguage } from './language'
import { getStockMetrics } from './stockMetrics'

function countPendingDrafts(drafts) {
  return drafts.filter(draft => draft.lines?.some(line => Number(line.outstanding) > 0)).length
}

export default function ManagerHome({ api, items, stockState, planDate, planSummary, busy = false, onOpenGuides, onOpenQuestions, onOpenPurchases, onQuestionData, children }) {
  const { t, language } = useLanguage()
  const [data, setData] = useState({ drafts: null, guides: null, questions: null })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    let active = true
    setData({ drafts: null, guides: null, questions: null })
    setErrors({})
    Promise.allSettled([api.get('/drafts'), api.get('/guidance'), api.get('/escalations')]).then(([drafts, guides, questions]) => {
      if (!active) return
      const settled = { drafts, guides, questions }
      setData(Object.fromEntries(Object.entries(settled).map(([key, result]) => [key, result.status === 'fulfilled' ? result.value : null])))
      setErrors(Object.fromEntries(Object.entries(settled).map(([key, result]) => [key, result.status === 'rejected' ? result.reason?.message || true : false])))
      onQuestionData?.(questions.status === 'fulfilled' ? questions.value : null)
    })
    return () => { active = false }
  }, [api, onQuestionData])

  const metrics = getStockMetrics(items)
  const planKnown = planSummary?.date === planDate && planSummary.state === 'ready'
  const openQuestions = data.questions?.filter(question => question.status === 'OPEN') || []
  const publishedGuides = data.guides?.filter(guide => guide.published) || []
  const needsReview = publishedGuides.filter(guide => guide.recipeChanged || guide.draftRecipeChanged).length
  const money = value => { const [whole, decimals = ''] = String(value).split('.'); return `₹${new Intl.NumberFormat('en-IN').format(BigInt(whole))}.${decimals.padEnd(2,'0')}` }
  const stockUnavailable = stockState !== 'ready'
  const stockValue = stockUnavailable ? t(stockState === 'loading' ? 'home.loading' : 'home.unavailable') : `${metrics.partial ? `${t('home.partial')} · ` : ''}${money(metrics.value)}`
  const supplierValue = stockUnavailable ? t(stockState === 'loading' ? 'home.loading' : 'home.unavailable') : metrics.activeSuppliers
  const shortageValue = planKnown ? planSummary.shortageCount : t(planSummary?.date === planDate && planSummary.state === 'unavailable' ? 'home.unavailable' : 'home.loading')
  const draftValue = errors.drafts ? t('home.unavailable') : data.drafts ? countPendingDrafts(data.drafts) : t('home.loading')
  const statCards = [
    { key: 'stockValue', label: t('home.stockValue'), value: stockValue, caption: metrics.partial && !stockUnavailable ? t('home.partialStockCaption') : t('home.stockValueCaption'), icon: Wallet, featured: true },
    { key: 'suppliers', label: t('home.activeSuppliers'), value: supplierValue, caption: t('home.suppliersCaption'), icon: Users },
    { key: 'shortages', label: t('home.lowStock'), value: shortageValue, caption: t('home.shortageCaption',{date:planDate}), icon: AlertTriangle },
    { key: 'drafts', label: t('home.pendingDrafts'), value: draftValue, caption: errors.drafts ? t('home.dataUnavailable') : t('home.latestDrafts'), icon: ShoppingCart },
  ]

  return <div className="manager-dashboard">
    <section className="stat-bento" aria-label={t('home.summary')}>
      {statCards.map(({ key, label, value, caption, icon: Icon, featured }) => <article key={key} className={`stat-tile${featured ? ' stat-tile-featured' : ''}`}>
        <div className="stat-tile-top"><span className="stat-tile-icon"><Icon aria-hidden="true" size={19}/></span><span className="stat-tile-label">{label}</span></div>
        <strong className="stat-tile-value tabular-nums">{value}</strong><span className="stat-tile-caption">{caption}</span>
      </article>)}
    </section>
    <div className="manager-grid"><div className="manager-main">{children}</div><aside className="manager-rail" aria-label={t('home.actionRail')}>
      <section className="rail-card">
        <div className="rail-heading"><span className="rail-icon"><BookOpen size={18} aria-hidden="true"/></span><div><h2>{t('home.sopTitle')}</h2><p>{t('home.sopCaption')}</p></div></div>
        {errors.guides ? <p className="rail-state" role="status">{t('home.unavailable')}</p> : data.guides ? <p className="rail-count">{publishedGuides.length} <span>{t('home.publishedGuides')}</span>{needsReview > 0 && <b className="rail-review">{t('home.needsReview',{count:needsReview})}</b>}</p> : <p className="rail-state" role="status">{t('home.loading')}</p>}
        <button type="button" className="rail-action" disabled={busy} onClick={onOpenGuides}>{t('home.openGuides')}<span aria-hidden="true">↗</span></button>
      </section>
      <section className="rail-card">
        <div className="rail-heading"><span className="rail-icon"><CircleHelp size={18} aria-hidden="true"/></span><div><h2>{t('home.questionsTitle')}</h2><p>{t('home.questionsCaption')}</p></div></div>
        {errors.questions ? <p className="rail-state" role="status">{t('home.unavailable')}</p> : data.questions ? <p className="rail-count">{openQuestions.length} <span>{t('home.openQuestions')}</span></p> : <p className="rail-state" role="status">{t('home.loading')}</p>}
        <button type="button" className="rail-action" disabled={busy} onClick={onOpenQuestions}>{t('home.openQuestionsAction')}<span aria-hidden="true">↗</span></button>
      </section>
      <section className="rail-card rail-purchase">
        <div className="rail-heading"><span className="rail-icon"><ClipboardList size={18} aria-hidden="true"/></span><div><h2>{t('home.purchaseTitle')}</h2><p>{t('home.purchaseCaption')}</p></div></div>
        {errors.drafts ? <p className="rail-state" role="status">{t('home.unavailable')}</p> : data.drafts ? <p className="rail-count">{countPendingDrafts(data.drafts)} <span>{t('home.pendingDrafts')}</span></p> : <p className="rail-state" role="status">{t('home.loading')}</p>}
        <button type="button" className="rail-action" disabled={busy} onClick={onOpenPurchases}>{t('home.openPurchases')}<span aria-hidden="true">↗</span></button>
      </section>
    </aside></div>
  </div>
}
