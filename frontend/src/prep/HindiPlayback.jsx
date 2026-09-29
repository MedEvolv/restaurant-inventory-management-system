import { useEffect,useRef,useState } from 'react'
import { useLanguage } from './language'

const localVoice=language=>{
  try{if(typeof window==='undefined'||!window.speechSynthesis||!window.SpeechSynthesisUtterance)return null;const prefix=language==='en'?/^en(?:-|$)/i:/^hi(?:-|$)/i;return window.speechSynthesis.getVoices().find(voice=>voice.localService===true&&prefix.test(voice.lang))||null}catch{return null}
}
export default function HindiPlayback({text,contentLanguage='hi',interfaceLanguage}){
  const {language:contextLanguage,t}=useLanguage(),uiLanguage=interfaceLanguage||contextLanguage
  const [voice,setVoice]=useState(()=>localVoice(contentLanguage)),[speaking,setSpeaking]=useState(false),[status,setStatus]=useState('')
  const generation=useRef(0)
  useEffect(()=>{
    let active=true;const synth=window.speechSynthesis,playbackGeneration=generation
    const update=()=>{if(active)setVoice(localVoice(contentLanguage))}
    if(!synth||!window.SpeechSynthesisUtterance){setVoice(null);setStatus(t('play.noVoice',{language:contentLanguage==='en'?'English':'हिन्दी'}));return ()=>{active=false}}
    update();synth.addEventListener?.('voiceschanged',update)
    return()=>{active=false;synth.removeEventListener?.('voiceschanged',update);playbackGeneration.current++;try{synth.cancel()}catch{}}
  },[contentLanguage,text,uiLanguage,t])
  useEffect(()=>{generation.current++;try{window.speechSynthesis?.cancel()}catch{};setSpeaking(false);setStatus('')},[text,contentLanguage,uiLanguage])
  function stop(){generation.current++;try{window.speechSynthesis?.cancel()}catch{}setSpeaking(false);setStatus(t('play.stopped'))}
  function play(){
    const candidate=localVoice(contentLanguage)
    if(!candidate){setVoice(null);setStatus(t('play.noVoice',{language:contentLanguage==='en'?'English':'हिंदी'}));return}
    const synth=window.speechSynthesis,id=++generation.current;let utterance
    try{synth.cancel();utterance=new window.SpeechSynthesisUtterance(text);utterance.voice=candidate;utterance.lang=candidate.lang}catch{setSpeaking(false);setStatus(t('play.error'));return}
    const current=()=>generation.current===id
    utterance.onstart=()=>{if(current()){setSpeaking(true);setStatus(t('play.speaking'))}}
    utterance.onend=()=>{if(current()){setSpeaking(false);setStatus(t('play.done'))}}
    utterance.onerror=()=>{if(current()){setSpeaking(false);setStatus(t('play.error'))}}
    setVoice(candidate);setSpeaking(true);setStatus(t('play.starting'));try{synth.speak(utterance)}catch{if(current()){setSpeaking(false);setStatus(t('play.error'))}}
  }
  return <div className="hindi-playback">{voice?<><button className="button secondary" type="button" aria-label={t('play.listen')} onClick={play}>{t('play.listen')}</button>{speaking&&<button className="text-button" type="button" aria-label={t('play.stop')} onClick={stop}>{t('play.stop')}</button>}</>:<p className="muted" role="status">{status||t('play.noVoice',{language:contentLanguage==='en'?'English':'हिंदी'})}</p>}{status&&voice&&<p className="muted" role="status">{status}</p>}</div>
}
