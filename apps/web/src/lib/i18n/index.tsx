'use client'

import React, { createContext, useContext } from 'react'
import { translations, type Locale, type TranslationKeys } from './translations'

interface LocaleContextValue {
  locale: Locale
  t: TranslationKeys
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'es',
  t: translations.es,
})

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  const t = translations[locale] || translations.es

  return (
    <LocaleContext.Provider value={{ locale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}

export function useTranslation(locale?: Locale): TranslationKeys {
  const context = useContext(LocaleContext)
  if (locale) {
    return translations[locale] || translations.es
  }
  return context.t
}

export function getTranslations(locale: string): TranslationKeys {
  const validLocale = (['es', 'en', 'pt'].includes(locale) ? locale : 'es') as Locale
  return translations[validLocale]
}
