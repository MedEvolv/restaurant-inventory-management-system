import { createContext, useContext } from 'react'
import { translate } from './messages'

export const LANGUAGE_KEY = 'group1-ui-language'
export const LanguageContext = createContext({ language: 'hi', setLanguage: () => {}, t: (key, values) => translate('hi', key, values) })
export const useLanguage = () => useContext(LanguageContext)
export function normalizeLanguage(value) { return value === 'en' ? 'en' : 'hi' }
export function readLanguage(storage) {
  try { return normalizeLanguage((storage ?? globalThis.localStorage)?.getItem(LANGUAGE_KEY)) } catch { return 'hi' }
}
