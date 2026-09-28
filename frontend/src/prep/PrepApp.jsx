import { useEffect,useState,useCallback } from 'react'
import { FiPackage,FiCalendar,FiShoppingBag,FiBookOpen } from 'react-icons/fi'
import { api,kitchenDate } from './api'
import StockPanel from './StockPanel'
import PlanPanel from './PlanPanel'
import DraftPanel from './DraftPanel'
import NotesPanel from './NotesPanel'
import DemoReset from './DemoReset'

const navigation=[{key:'plan',label:"Tomorrow's plan",icon:FiCalendar},{key:'stock',label:'Stock & dates',icon:FiPackage},{key:'drafts',label:'Purchase drafts',icon:FiShoppingBag},{key:'notes',label:'Waste & notes',icon:FiBookOpen}]
export default function PrepApp() {
  const [tab,setTab]=useState('plan')
  const [planDate,setPlanDate]=useState(() => kitchenDate(1))
  const [items,setItems]=useState([])
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')
  const [saving,setSaving]=useState(false)
  const [loading,setLoading]=useState(true)
  const reportError=useCallback(error=>setError(error.message || String(error)),[])
  const refresh=useCallback(async () => { setItems(await api.get('/ingredients')) },[])
  useEffect(() => { refresh().catch(error => setError(error.message)).finally(() => setLoading(false)) },[refresh])
  async function mutate(operation,success) {
    if(saving) return false
    setSaving(true); setError(''); setMessage('')
    try { const result=await operation(); setMessage(success); try { await refresh() } catch(error){setError(`Change recorded, but the stock view could not refresh. Refresh before the next action. ${error.message}`)} return result || true }
    catch(error) { setError(error.message); return false }
    finally { setSaving(false) }
  }
  return <div className="prep-app">
    <aside className="sidebar"><a className="brand" href="#plan" onClick={()=>setTab('plan')}><span className="brand-mark">T</span><span>Tomorrow's<br/>Prep & Purchase</span></a><p className="sidebar-caption">One kitchen. A clearer tomorrow.</p>
      <nav aria-label="Main navigation">{navigation.map(({key,label,icon:Icon}) => <button key={key} className={tab===key?'active':''} onClick={() => setTab(key)}><Icon aria-hidden="true"/>{label}</button>)}</nav>
      <div className="sidebar-bottom"><span className="sample-dot"/>Fictional hostel kitchen<p>Sample quantities. No measured savings.</p></div>
    </aside>
    <div className="workspace"><header className="topbar"><span className="sample-label">SAMPLE DATA</span><label>Planning for<input aria-label="Planning date" type="date" required value={planDate} onChange={event => setPlanDate(event.target.value)}/></label><span className="manager">Anita Rao <small>Sample kitchen manager</small></span></header>
      <main>{error && <div className="alert error" role="alert">{error}<button className="text-button" onClick={() => refresh().then(() => setError('')).catch(error => setError(error.message))}>Refresh</button></div>}{message && <div className="alert success" role="status">{message}</div>}
        {loading?<p className="panel">Loading the recorded kitchen…</p>:tab==='stock'?<StockPanel items={items} today={kitchenDate()} planDate={planDate} mutate={mutate} api={api} saving={saving}/>:tab==='plan'?<PlanPanel items={items} planDate={planDate} api={api} mutate={mutate} saving={saving} reportError={reportError} onDraftSaved={()=>setTab('drafts')}/>:tab==='drafts'?<DraftPanel items={items} api={api} mutate={mutate} saving={saving} reportError={reportError}/>:<NotesPanel items={items} api={api} mutate={mutate} saving={saving} reportError={reportError}/>}
        <DemoReset api={api} mutate={mutate} reportError={reportError} saving={saving} onReset={date=>{setPlanDate(date);setTab('plan')}}/>
      </main><footer>Planning estimates use recorded stock and planned portions. You make the purchasing decision.</footer>
    </div>
  </div>
}
