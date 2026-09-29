import { useEffect,useState } from 'react'
import { useLanguage } from './language'

export default function GuidancePhoto({photo}) {
  const {t}=useLanguage()
  const [failed,setFailed]=useState(false)
  useEffect(()=>setFailed(false),[photo.url,photo.id])
  return <figure className="guidance-photo panel"><div className="guidance-photo-frame">{failed?<p role="status">{t('photo.unavailable')}</p>:<img loading="lazy" src={photo.url} alt={photo.caption || t('photo.alt')} onError={()=>setFailed(true)}/>}</div>{photo.caption&&<figcaption>{photo.caption}</figcaption>}<p className="muted small">{photo.kind==='PORTION'?t('photo.portion'):t('photo.process')}{photo.isDemo?` · ${t('photo.demo')}`:''}</p></figure>
}
