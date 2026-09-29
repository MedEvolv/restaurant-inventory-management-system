import { useCallback, useEffect, useState } from 'react'
import { FiCalendar, FiBookOpen, FiMoreHorizontal } from 'react-icons/fi'
import { api, kitchenDate } from './api'
import StockPanel from './StockPanel'
import PlanPanel from './PlanPanel'
import DraftPanel from './DraftPanel'
import NotesPanel from './NotesPanel'
import DemoReset from './DemoReset'
import TodayPanel from './TodayPanel'
import GuidanceManager from './GuidanceManager'
import ManagerHome from './ManagerHome'
import { Search, Bell, CalendarDays, ChefHat } from 'lucide-react'
import { matchesRecipeName } from './recipeSearch'
import LanguageProvider from './LanguageProvider'
import { useLanguage } from './language'

const moreViews = ['ingredients', 'dishes', 'stock', 'purchases', 'records']
function PrepAppContent() {
  const { language, setLanguage, t } = useLanguage()
  const [mode, setMode] = useState('staff')
  const [tab, setTab] = useState('today')
  const [moreView, setMoreView] = useState('ingredients')
  const [workDate, setWorkDate] = useState(() => kitchenDate())
  const [planDate, setPlanDate] = useState(() => kitchenDate())
  const [visitedGuides, setVisitedGuides] = useState(false)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [stockError, setStockError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [panelBusy, setPanelBusy] = useState(false)
  const [quickSearch, setQuickSearch] = useState('')
  const [quickRecipes, setQuickRecipes] = useState(null)
  const [quickPick, setQuickPick] = useState(null)
  const [questionData, setQuestionData] = useState(undefined)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [planSummary, setPlanSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const reportError = useCallback(value => setError(value.message || String(value)), [])
  const refresh = useCallback(async () => { try { const nextItems = await api.get('/ingredients'); setItems(nextItems); setStockError(''); return nextItems } catch (value) { setStockError(value.message || String(value)); throw value } }, [])
  useEffect(() => { refresh().catch(value => setStockError(value.message)).finally(() => setLoading(false)) }, [refresh])
  async function mutate(operation, success) {
    if (saving) return false
    setSaving(true); setError(''); setMessage('')
    try { const result = await operation(); setMessage(success); try { await refresh() } catch (value) { setError({key:'app.refreshWarning',detail:value.message}) } return result || true }
    catch (value) { setError(value.message); return false }
    finally { setSaving(false) }
  }
  const manager = mode === 'manager'
  const navigationBusy = panelBusy || saving
  function switchMode(next) {
    setQuickRecipes(null); setMode(next); setError(''); setMessage('')
    if (next === 'manager') { setTab('plan'); setPlanDate(workDate) }
    else { setTab('today') }
  }
  function openGuides() { setVisitedGuides(true); setTab('guides') }
  function openStaffPlan(date) { setPlanDate(date); setMode('manager'); setTab('plan') }
  async function loadQuickRecipes(force = false) { if (quickRecipes === null || force) { try { setQuickRecipes(await api.get('/recipes')) } catch (value) { setQuickRecipes([]); reportError(value) } } }
  const onPlanSummary = useCallback(value => setPlanSummary(value), [])
  const onQuestionData = useCallback(value => setQuestionData(value), [])
  function openQuestions() { openGuides(); setTimeout(() => window.dispatchEvent(new CustomEvent('prep:open-questions')), 0) }
  function selectQuickRecipe(recipe) { if (navigationBusy) return; setQuickPick(recipe); setMode('manager'); setTab('plan'); setQuickSearch('') }
  const showMain = key => tab === key
  return <div className="prep-app">
    <aside className="sidebar"><a className="brand" aria-disabled={navigationBusy} href="#today" onClick={event => { event.preventDefault(); if (!navigationBusy) manager ? setTab('plan') : setTab('today') }}><span className="brand-mark"><ChefHat size={18}/></span><span>{t('brand.name')}<br/><span className="brand-subtitle">{t('brand.subtitle')}</span></span></a><p className="sidebar-caption">{t('app.caption')}</p>
      <nav aria-label={t('app.main')}>{manager ? <><button type="button" disabled={navigationBusy} className={tab === 'plan' ? 'active' : ''} onClick={() => { setQuickRecipes(null); setTab('plan') }}><FiCalendar aria-hidden="true"/>{t('nav.plan')}</button><button type="button" disabled={navigationBusy} className={tab === 'guides' ? 'active' : ''} onClick={openGuides}><FiBookOpen aria-hidden="true"/>{t('nav.guides')}</button><button type="button" disabled={navigationBusy} className={tab === 'more' ? 'active' : ''} aria-expanded={tab === 'more'} onClick={() => setTab('more')}><FiMoreHorizontal aria-hidden="true"/>{t('nav.more')}</button></> : <button type="button" className="active" onClick={() => setTab('today')}>{t('nav.today')}</button>}</nav>
      {manager && tab === 'more' && <nav className="more-navigation" aria-label={t('nav.moreItems')}>{moreViews.map(key => <button key={key} type="button" disabled={navigationBusy} className={moreView === key ? 'active' : ''} onClick={() => setMoreView(key)}>{t(`nav.${key}`)}</button>)}</nav>}
      <div className="sidebar-bottom"><span className="sample-dot"/>{t('app.demo')}</div>
    </aside>
    <div className="workspace"><header className="topbar"><a className="brand top-brand" href="#today" onClick={e=>e.preventDefault()}><span className="brand-mark"><ChefHat size={18}/></span><span>{t('brand.name')}<small>{t('brand.subtitle')}</small></span></a><button type="button" className="button secondary week-jump" disabled={navigationBusy} onClick={() => { setMode('manager'); setTab('plan'); setPlanDate(kitchenDate()) }}><CalendarDays size={17}/>{t('app.thisWeekPlanner')}</button>{manager && <div className="quick-search"><Search size={18} aria-hidden="true"/><input aria-label={t('app.quickSearch')} placeholder={t('app.quickSearchHint')} value={quickSearch} onFocus={()=>loadQuickRecipes(true)} onChange={e=>{setQuickSearch(e.target.value);loadQuickRecipes()}}/>{quickSearch && quickRecipes && <div className="quick-results" role="listbox" aria-label={t('app.quickSearch')}>{quickRecipes.filter(recipe=>recipe.active!==false&&matchesRecipeName(recipe,quickSearch,language)).slice(0,6).map(recipe=><button role="option" aria-selected="false" key={recipe.id} type="button" disabled={navigationBusy} onClick={()=>selectQuickRecipe(recipe)}>{recipe.name}</button>)}{!quickRecipes.some(recipe=>recipe.active!==false&&matchesRecipeName(recipe,quickSearch,language))&&<p role="status">{t('app.noQuickMatches')}</p>}</div>}</div>}<label className="role-select"><span>{t('app.operatingView')}</span><select value={mode} disabled={navigationBusy} onChange={e=>switchMode(e.target.value)} aria-label={t('app.operatingView')}><option value="staff">{t('app.cookView')}</option><option value="manager">{t('app.managerView')}</option></select></label><label className="language-control"><span>{t('language.label')}</span><span><button type="button" aria-label={t('language.hi')} aria-pressed={language === 'hi'} className={language === 'hi' ? 'active' : ''} onClick={() => setLanguage('hi')}>हिन्दी</button><button type="button" aria-label={t('language.en')} aria-pressed={language === 'en'} className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>English</button></span></label>{manager && <div className="notification-wrap"><button type="button" disabled={navigationBusy} className="icon-button" aria-label={t('app.notifications')} aria-expanded={notificationsOpen} onClick={()=>setNotificationsOpen(v=>!v)}><Bell size={19}/>{questionData?.filter(q=>q.status==='OPEN').length>0&&<i/>}</button>{notificationsOpen&&<div className="notification-popover"><strong>{t('app.notifications')}</strong><p>{questionData===undefined?t('home.loading'):questionData===null?t('home.unavailable'):t('app.openQuestionsCount',{count:questionData.filter(q=>q.status==='OPEN').length})}</p><button type="button" disabled={navigationBusy} className="rail-action" onClick={()=>{setNotificationsOpen(false);openQuestions()}}>{t('app.reviewQuestions')}</button></div>}</div>}<span className="sample-label">{t('app.demo')}</span></header>
      <main>{manager && <p className="manager-demo-note muted small">{language === 'hi' ? 'स्थानीय प्रदर्शन दृश्य में साइन-इन या अनुमति नियंत्रण लागू नहीं हैं।' : 'Sign-in and permission controls are not active in this local demo.'}</p>}{manager && error && <div className="alert error" role="alert">{typeof error==='string'?error:<>{t(error.key)} {error.detail}</>}<button className="text-button" onClick={() => refresh().then(() => setError('')).catch(value => setError(value.message))}>{t('app.refresh')}</button></div>}{message && <div className="alert success" role="status">{typeof message==='string'?message:t(message.key,message.values)}</div>}
        {!manager && <TodayPanel api={api} initialDate={workDate} onDateChange={setWorkDate} onBusyChange={setPanelBusy} onPlanDate={openStaffPlan}/>}
        {visitedGuides && <div hidden={!manager || tab !== 'guides'}><GuidanceManager api={api} onBusyChange={setPanelBusy}/></div>}
        {manager && tab === 'plan' && <ManagerHome api={api} items={items} stockState={loading?'loading':stockError?'unavailable':'ready'} planDate={planDate} planSummary={planSummary} busy={navigationBusy} onOpenGuides={openGuides} onOpenQuestions={openQuestions} onOpenPurchases={() => {setMoreView('purchases');setTab('more')}} onQuestionData={onQuestionData}><PlanPanel items={items} stockCountsState={loading?'loading':stockError?'unavailable':'ready'} onOpenStock={() => { setMoreView('stock'); setTab('more') }} planDate={planDate} onDateChange={setPlanDate} onBusyChange={setPanelBusy} onSummaryChange={onPlanSummary} quickPick={quickPick} onQuickPickConsumed={()=>setQuickPick(null)} view="menu" api={api} mutate={mutate} saving={saving} reportError={reportError} onDraftSaved={() => { setMoreView('purchases'); setTab('more') }}/></ManagerHome>}
        {manager && tab === 'more' && (moreView === 'ingredients' || moreView === 'dishes') && <PlanPanel items={items} planDate={planDate} onDateChange={setPlanDate} onBusyChange={setPanelBusy} view={moreView} api={api} mutate={mutate} saving={saving} reportError={reportError} onDraftSaved={() => setMoreView('purchases')}/>}
        {manager && tab === 'more' && loading && <div className="panel" role="status">{t('app.loading')}</div>}
        {manager && tab === 'more' && !loading && stockError && <div className="panel" role="alert"><p>{t('app.stockFail')}: {stockError}</p><button className="text-button" onClick={() => { setLoading(true); refresh().then(() => setStockError('')).catch(value => setStockError(value.message)).finally(() => setLoading(false)) }}>{t('manager.retry')}</button></div>}
        {manager && tab === 'more' && !loading && !stockError && moreView === 'stock' && <StockPanel items={items} today={kitchenDate()} planDate={planDate} mutate={mutate} api={api} saving={saving}/>}
        {manager && tab === 'more' && !loading && !stockError && moreView === 'purchases' && <DraftPanel items={items} api={api} mutate={mutate} saving={saving} reportError={reportError}/>}
        {manager && tab === 'more' && !loading && !stockError && moreView === 'records' && <NotesPanel items={items} api={api} mutate={mutate} saving={saving} reportError={reportError}/>}
        {manager && <div hidden={!showMain('more')}><DemoReset api={api} mutate={mutate} reportError={reportError} saving={saving} onReset={date => { setPlanDate(date); setTab('plan') }}/></div>}
      </main><footer>{t('app.footer')}</footer>
    </div>
  </div>
}
export default function PrepApp() { return <LanguageProvider><PrepAppContent/></LanguageProvider> }
