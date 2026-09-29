import { useEffect,useState } from 'react'
import { useLanguage } from './language'
export default function DemoReset({api,mutate,onReset,reportError,saving}) {
  const {t}=useLanguage(),[enabled,setEnabled]=useState(false),[open,setOpen]=useState(false),[confirmation,setConfirmation]=useState(''),[mode,setMode]=useState('explore')
  useEffect(()=>{api.get('/demo').then(r=>setEnabled(r.resetEnabled)).catch(reportError)},[api,reportError])
  if(!enabled)return null
  async function reset(e){e.preventDefault();const result=await mutate(()=>api.post('/demo/reset',{confirmation,mode}),{key:'support.resetSuccess'});if(result){setOpen(false);setConfirmation('');onReset(result.date)}}
  return <details className="demo-tools support-disclosure"><summary>{t('support.demoTools')}</summary><div className="demo-tools-content"><button className="button secondary" disabled={saving} onClick={()=>setOpen(!open)}>{t('support.reset')}</button>{open&&<form className="panel form-grid" onSubmit={reset}><fieldset disabled={saving} className="form-grid-lock"><h2 className="full">{t('support.resetTitle')}</h2><p className="muted full">{t('support.resetIntro')}</p><label>{t('support.startingPoint')}<select value={mode} onChange={e=>setMode(e.target.value)}><option value="explore">{t('support.explore')}</option><option value="walkthrough">{t('support.walkthrough')}</option></select></label><label>{t('support.confirmReset')}<input required value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label><div className="full"><button className="button" disabled={confirmation!=='RESET FICTIONAL KITCHEN'}>{t('support.reseed')}</button><button type="button" className="text-button" onClick={()=>setOpen(false)}>{t('support.cancelReset')}</button></div></fieldset></form>}</div></details>
}
