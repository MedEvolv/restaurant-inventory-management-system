import { useCallback, useEffect, useMemo, useState } from 'react'
import { LANGUAGE_KEY, LanguageContext, normalizeLanguage, readLanguage } from './language'
import { translate } from './messages'

export default function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(readLanguage)
  const setLanguage = useCallback(value => setLanguageState(normalizeLanguage(value)), [])
  useEffect(() => {
    try { globalThis.localStorage?.setItem(LANGUAGE_KEY, language) } catch {}
    if (globalThis.document?.documentElement) globalThis.document.documentElement.lang = language
  }, [language])
  const value = useMemo(() => ({ language, setLanguage, t: (key, values) => translate(language, key, values) }), [language, setLanguage])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
