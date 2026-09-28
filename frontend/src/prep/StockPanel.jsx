import { useEffect,useState } from 'react'
import { dateTypes } from './api'

function compatibleUnits(unit) { return ['kg','g'].includes(unit) ? ['kg','g'] : ['L','ml','liters','litres'].includes(unit) ? ['L','ml'] : ['count'] }

export default function StockPanel({items, today, planDate, mutate, api, saving = false,preset,hideStock=false,onRecorded}) {
  const [form,setForm] = useState(null)
  const [receipt,setReceipt] = useState({ingredientId:'',quantity:'',unit:'kg',unitCost:'',supplier:'',receivedDate:today,labelDate:'',dateType:'UNKNOWN'})
  const [requestKey,setRequestKey] = useState(() => crypto.randomUUID())
  const [newItem,setNewItem] = useState({name:'',unit:'kg'})
  useEffect(()=>{ if(preset){setReceipt({ingredientId:String(preset.ingredientId),quantity:preset.quantity,unit:preset.unit,unitCost:'',supplier:'',receivedDate:today,labelDate:'',dateType:'UNKNOWN',draftLineId:preset.id});setRequestKey(crypto.randomUUID());setForm('receipt')} },[preset,today])
  function openReceipt() {
    const first=items[0]
    setReceipt(previous => ({...previous,ingredientId:String(first?.id || ''),unit:first?.unit || 'kg'}))
    setForm(form==='receipt'?null:'receipt')
  }
  async function submitReceipt(event) {
    event.preventDefault()
    if(await mutate(() => api.post('/receipts',{...receipt,requestKey}),'Receipt recorded. Stock has been updated.')) {
      setRequestKey(crypto.randomUUID()); setReceipt(previous => ({...previous,quantity:'',unitCost:''})); setForm(null)
      onRecorded?.()
    }
  }
  async function create(event) {
    event.preventDefault()
    if(await mutate(() => api.post('/ingredients',newItem),'Ingredient added.')) { setNewItem({name:'',unit:'kg'}); setForm(null) }
  }
  const selected=items.find(item => String(item.id)===receipt.ingredientId)
  const update=(key,value) => setReceipt({...receipt,[key]:value})
  return <section>
    {!hideStock&&<div className="section-heading"><div><p className="eyebrow">YOUR RECORDED PANTRY</p><h1>Stock & dates</h1><p>Keep receipts separate. Know which lots need a closer look.</p></div><div className="actions"><button className="button secondary" disabled={saving} onClick={() => setForm(form==='ingredient'?null:'ingredient')}>Add ingredient</button><button className="button" disabled={!items.length||saving} onClick={openReceipt}>Receive stock</button></div></div>}
    {form==='ingredient' && <form className="panel form-grid" onSubmit={create}>
      <h2 className="full">New ingredient</h2>
      <label>Ingredient name<input required maxLength={120} value={newItem.name} onChange={event => setNewItem({...newItem,name:event.target.value})}/></label>
      <label>Stock unit<select value={newItem.unit} onChange={event => setNewItem({...newItem,unit:event.target.value})}>{['kg','g','L','ml','count'].map(unit => <option key={unit}>{unit}</option>)}</select></label>
      <div className="full form-footer"><button className="button" disabled={saving}>Create ingredient</button><button type="button" className="text-button" onClick={() => setForm(null)}>Cancel</button></div>
    </form>}
    {form==='receipt' && <form className="panel form-grid" onSubmit={submitReceipt}>
      <div className="full"><h2>Record an actual receipt</h2><p className="muted">Enter what arrived. Saving a purchase draft does not add stock.</p></div>
      <label>Ingredient<select required disabled={Boolean(receipt.draftLineId)} value={receipt.ingredientId} onChange={event => { const item=items.find(row => String(row.id)===event.target.value); setReceipt({...receipt,ingredientId:event.target.value,unit:item.unit}) }}>{items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Received quantity<input required type="number" min="0.000001" step="any" value={receipt.quantity} onChange={event => update('quantity',event.target.value)}/></label>
      <label>Received unit<select value={receipt.unit} onChange={event => update('unit',event.target.value)}>{compatibleUnits(selected?.unit || 'kg').map(unit => <option key={unit}>{unit}</option>)}</select></label>
      <label>Cost per received unit (₹)<input required type="number" min="0" step="0.0001" value={receipt.unitCost} onChange={event => update('unitCost',event.target.value)}/></label>
      <label>Supplier (optional)<input maxLength={160} value={receipt.supplier} onChange={event => update('supplier',event.target.value)}/></label>
      <label>Received date<input required type="date" max={today} value={receipt.receivedDate} onChange={event => update('receivedDate',event.target.value)}/></label>
      <label>Label date (optional)<input type="date" value={receipt.labelDate} onChange={event => setReceipt({...receipt,labelDate:event.target.value,dateType:event.target.value?'USE_BY':'UNKNOWN'})}/></label>
      <label>Date type<select value={receipt.dateType} onChange={event => update('dateType',event.target.value)}>{Object.entries(dateTypes).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <div className="full form-footer"><button className="button" disabled={saving}>Record receipt</button><button type="button" className="text-button" onClick={() => setForm(null)}>Cancel</button></div>
    </form>}
    {!hideStock&&<><p className="notice">Entered dates prompt human review. They do not determine whether food is safe. Lots without dates are marked unknown.</p>
    {!items.length && <div className="empty panel"><h2>Start with an ingredient</h2><p>Add an ingredient, then record what you have received.</p></div>}
    <div className="stock-grid">{items.map(item => <article className="panel stock-card" key={item.id}>
      <div className="stock-title"><h2>{item.name}</h2><span className="quantity">{item.onHand} <small>{item.unit}</small></span></div><p className="muted small">Physical recorded stock</p>
      {item.conversionError && <p className="error">{item.conversionError}</p>}{!item.lots.length && <p className="muted">No receipts recorded yet.</p>}
      {item.lots.map(lot => { const review=lot.labelDate && lot.labelDate<(planDate || today); return <div className="lot" key={lot.id}>
        <div><strong>Lot #{lot.id} · {lot.remaining} {lot.unit}</strong><span className={`badge ${review?'review':!lot.labelDate?'unknown':''}`}>{!lot.labelDate?'Date unknown':review?'Review entered date':'Date recorded'}</span></div>
        <p>Received {lot.receivedDate}{lot.supplier?` · ${lot.supplier}`:''}</p><p>{lot.labelDate?`${dateTypes[lot.dateType]}: ${lot.labelDate}`:'No label date recorded'}{lot.openingBalance?' · Imported opening balance':''}</p><p className="muted small">₹{lot.unitCost} / {lot.inputUnit} at receipt</p>
      </div> })}
    </article>)}</div></>}
  </section>
}
