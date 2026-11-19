import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useDirection } from '@/context/direction-provider'
import { ar } from '@/locales/ar'
import { en } from '@/locales/en'

export type Lang = 'ar' | 'en'

const dictionaries: Record<Lang, Record<string, string>> = { ar, en }

const LANG_KEY = 'app-lang'
const DEFAULT_LANG: Lang = 'ar'

type LanguageContextType = {
  lang: Lang
  setLang: (lang: Lang) => void
  // Keys are the English source strings. Missing keys fall back to the key itself.
  // Placeholders use {name}, e.g. t('{p}% completed', { p: 40 })
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

const readSavedLang = (): Lang => {
  const saved = localStorage.getItem(LANG_KEY)
  return saved === 'en' || saved === 'ar' ? saved : DEFAULT_LANG
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { setDir } = useDirection()
  const [lang, _setLang] = useState<Lang>(readSavedLang)

  // Keep <html lang> and text direction in sync with the chosen language
  useEffect(() => {
    document.documentElement.lang = lang
    setDir(lang === 'ar' ? 'rtl' : 'ltr')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    localStorage.setItem(LANG_KEY, next)
    _setLang(next)
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let text = dictionaries[lang][key] ?? key
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replace(`{${name}}`, String(value))
        }
      }
      return text
    },
    [lang]
  )

  return (
    <LanguageContext value={{ lang, setLang, t }}>{children}</LanguageContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
