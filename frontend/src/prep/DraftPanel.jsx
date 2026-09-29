import { useCallback,useEffect,useState } from 'react'
import StockPanel from './StockPanel'
import { kitchenDate } from './api'
import { useLanguage } from './language'

export default function DraftPanel({items,api,mutate,saving,reportError}) {
  const {t}=useLanguage(),[drafts,setDrafts]=useState([]),[receipt,setReceipt]=useState(null)
  const load=useCallback(async()=>setDrafts(await api.get('/drafts')),[api])
  useEffect(()=>{load().catch(reportError)},[load,items,reportError])
  return <section><div className="section-heading"><div><p className="eyebrow">{t('support.purchaseEyebrow')}</p><h1>{t('support.purchaseTitle')}</h1><p>{t('support.purchaseIntro')}</p></div></div>
    {!drafts.length&&<div className="panel empty"><h2>{t('support.noDrafts')}</h2><p>{t('support.noDraftsBody')}</p></div>}
    {drafts.map(draft=><details className="panel support-disclosure" key={draft.id}><summary>{t('support.openDraft',{id:draft.id,date:draft.date,outstanding:draft.lines.reduce((sum,line)=>sum+Number(line.outstanding),0)})}</summary><div className="section-title"><h2>{t('support.draft',{id:draft.id,date:draft.date})}</h2><span className="badge">{t('support.draftBadge')}</span></div><p className="muted">{t('support.savedBy',{actor:draft.actor,date:draft.createdAt.replace('T',' ')})}</p>{draft.stale&&<p className="badge review">{t('support.stale')}</p>}
      <div className="table-wrap"><table><thead><tr><th>{t('support.tableIngredient')}</th><th>{t('support.suggestedThen')}</th><th>{t('support.yourQuantity')}</th><th>{t('support.received')}</th><th>{t('support.outstanding')}</th><th>{t('support.actualArrival')}</th></tr></thead><tbody>{draft.lines.map(line=><tr key={line.id}><td>{line.name} ({line.unit})</td><td>{line.suggested}</td><td>{line.quantity}</td><td>{line.received}</td><td data-testid={`outstanding-${line.name}`}>{line.outstanding}</td><td><button className="button secondary" disabled={saving||Number(line.outstanding)===0} onClick={()=>setReceipt({...line,quantity:line.outstanding})}>{t('support.receiveFromDraft',{name:line.name,draft:draft.id})}</button></td></tr>)}</tbody></table></div>
      <details className="support-disclosure"><summary>{t('support.savedCalculation',{id:draft.id})}</summary><div className="table-wrap"><table><thead><tr><th>{t('support.tableIngredient')}</th><th>{t('support.required')}</th><th>{t('support.usableThen')}</th><th>{t('support.buffer')}</th><th>{t('support.suggested')}</th></tr></thead><tbody>{draft.snapshot.lines.map(line=><tr key={line.ingredientId}><td>{line.name} ({line.unit})</td><td>{line.required}</td><td>{line.usable}</td><td>{line.buffer}</td><td>{line.suggested}</td></tr>)}</tbody></table></div></details>
    </details>)}
    {receipt&&<StockPanel items={items} today={kitchenDate()} mutate={mutate} api={api} saving={saving} preset={receipt} hideStock onRecorded={()=>{setReceipt(null);load().catch(reportError)}}/>}
    <p className="notice">{t('support.partialNotice')}</p>
  </section>
}
