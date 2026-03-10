'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n'
import { Menu, X, Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const LOCALES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
]

export function PublicHeader() {
  const { locale, t } = useLocale()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  const navLinks = [
    { href: `/${locale}/como-funciona`, label: t.nav.howItWorks },
    { href: `/${locale}/para-quien`, label: t.nav.whoIsItFor },
    { href: `/${locale}/base-cientifica`, label: t.nav.scientificBasis },
  ]

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <span className="text-2xl">🎤</span>
            <span className="text-xl font-bold text-primary-700">VoiceCheck</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-600 hover:text-primary-700 font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Globe className="h-4 w-4" />
                <span>{locale.toUpperCase()}</span>
              </button>

              {langOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setLangOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                    {LOCALES.map((l) => (
                      <Link
                        key={l.code}
                        href={`/${l.code}`}
                        className={`block px-4 py-2 text-sm hover:bg-gray-50 ${
                          locale === l.code ? 'text-primary-600 font-medium' : 'text-gray-700'
                        }`}
                        onClick={() => setLangOpen(false)}
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            <Link href={`/${locale}/auth/login`}>
              <Button variant="ghost" size="sm">{t.nav.login}</Button>
            </Link>
            <Link href={`/${locale}/auth/registro`}>
              <Button variant="primary" size="sm">{t.nav.register}</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 rounded-md text-sm text-gray-600 hover:text-primary-700 hover:bg-primary-50 font-medium"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
              {LOCALES.map((l) => (
                <Link
                  key={l.code}
                  href={`/${l.code}`}
                  className={`block px-3 py-2 rounded-md text-sm ${
                    locale === l.code ? 'text-primary-600 font-medium bg-primary-50' : 'text-gray-600'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 mt-3 flex gap-2">
              <Link href={`/${locale}/auth/login`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">{t.nav.login}</Button>
              </Link>
              <Link href={`/${locale}/auth/registro`} className="flex-1">
                <Button variant="primary" size="sm" className="w-full">{t.nav.register}</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
