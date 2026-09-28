import { useCallback,useEffect,useState } from 'react'
import StockPanel from './StockPanel'
import { kitchenDate } from './api'

export default function DraftPanel({items,api,mutate,saving,reportError}) {
  const [drafts,setDrafts]=useState([]),[selected,setSelected]=useState(null),[receipt,setReceipt]=useState(null)
  const load=useCallback(async()=>setDrafts(await api.get('/drafts')),[api])
  useEffect(()=>{load().catch(reportError)},[load,items,reportError])
  return <section><div className="section-heading"><div><p className="eyebrow">REVIEWED BY YOU</p><h1>Purchase drafts</h1><p>Your saved decisions, separate from stock that has arrived.</p></div></div>
    {!drafts.length&&<div className="panel empty"><h2>No purchase drafts yet</h2><p>Plan dishes and review the ingredient estimate to save your first draft.</p></div>}
    {drafts.map(draft=><article className="panel" key={draft.id}><div className="section-title"><h2>Draft #{draft.id} · {draft.date}</h2><span className="badge">DRAFT · no order sent</span></div><p className="muted">Saved by {draft.actor} · {draft.createdAt.replace('T',' ')} (kitchen time)</p>{draft.stale&&<p className="badge review">Plan or stock changed since this snapshot. Review today's estimate before purchasing.</p>}<div className="table-wrap"><table><thead><tr><th>Ingredient</th><th>Suggested then</th><th>Your quantity</th><th>Received</th><th>Outstanding</th><th>Actual arrival</th></tr></thead><tbody>{draft.lines.map(line=><tr key={line.id}><td>{line.name} ({line.unit})</td><td>{line.suggested}</td><td>{line.quantity}</td><td>{line.received}</td><td data-testid={`outstanding-${line.name}`}>{line.outstanding}</td><td><button className="button secondary" disabled={saving||Number(line.outstanding)===0} onClick={()=>setReceipt({...line,quantity:line.outstanding})}>Receive {line.name} from draft #{draft.id}</button></td></tr>)}</tbody></table></div><button className="text-button" onClick={()=>setSelected(selected===draft.id?null:draft.id)}>View saved calculation for draft #{draft.id}</button>{selected===draft.id&&<div className="table-wrap"><table><thead><tr><th>Ingredient</th><th>Required</th><th>Usable then</th><th>Buffer</th><th>Suggested</th></tr></thead><tbody>{draft.snapshot.lines.map(line=><tr key={line.ingredientId}><td>{line.name} ({line.unit})</td><td>{line.required}</td><td>{line.usable}</td><td>{line.buffer}</td><td>{line.suggested}</td></tr>)}</tbody></table></div>}</article>)}
    {receipt&&<StockPanel items={items} today={kitchenDate()} mutate={mutate} api={api} saving={saving} preset={receipt} hideStock onRecorded={()=>{setReceipt(null);load().catch(reportError)}}/>}
    <p className="notice">A partial arrival leaves the rest outstanding. Repeated receipt submissions update stock once. Drafts retain their original calculation.</p>
  </section>
}
