import React from 'react'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n'

export function PublicFooter() {
  const { locale, t } = useLocale()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🎤</span>
              <span className="text-xl font-bold text-white">VoiceCheck</span>
            </div>
            <p className="text-sm text-gray-400 mb-4 max-w-sm">
              {t.footer.tagline}
            </p>
            <div className="bg-yellow-900/50 border border-yellow-700/50 rounded-lg p-3">
              <p className="text-xs text-yellow-300 leading-relaxed">
                ⚠️ {t.footer.disclaimer}
              </p>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              VoiceCheck
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}/como-funciona`}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t.footer.links.howItWorks}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/para-quien`}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t.footer.links.whoIsItFor}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/base-cientifica`}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t.footer.links.scientificBasis}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}/privacidad`}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t.footer.links.privacy}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/terminos`}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t.footer.links.terms}
                </Link>
              </li>
              <li>
                <Link
                  href={`mailto:hola@voicecheck.app`}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t.footer.links.contact}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">{t.footer.copyright}</p>
          <div className="flex items-center gap-4">
            <Link href="/es" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Español</Link>
            <Link href="/en" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">English</Link>
            <Link href="/pt" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Português</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
