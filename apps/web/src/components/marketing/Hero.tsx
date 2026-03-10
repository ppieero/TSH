import React from 'react'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n'
import { Button } from '@/components/ui/Button'
import { ArrowRight, Play } from 'lucide-react'

export function Hero() {
  const { locale, t } = useLocale()

  return (
    <section className="relative bg-gradient-to-br from-primary-50 via-white to-blue-50 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100 rounded-full opacity-50 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-100 rounded-full opacity-40 blur-2xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
              <span className="text-base">🎤</span>
              {t.hero.badge}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              {t.hero.title}
            </h1>

            <p className="text-lg text-gray-600 mb-8 max-w-xl leading-relaxed">
              {t.hero.subtitle}
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link href={`/${locale}/auth/registro`}>
                <Button size="lg" variant="primary" className="gap-2">
                  {t.hero.cta}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href={`/${locale}/como-funciona`}>
                <Button size="lg" variant="secondary" className="gap-2">
                  <Play className="h-4 w-4" />
                  {t.hero.ctaSecondary}
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              {[
                { value: '17', label: t.hero.stat1 },
                { value: 'IA', label: t.hero.stat2 },
                { value: '<5min', label: t.hero.stat3 },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary-600">{stat.value}</span>
                  <span className="text-sm text-gray-500">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Illustration */}
          <div className="flex justify-center items-center">
            <div className="relative">
              {/* Main device mockup */}
              <div className="bg-white rounded-3xl shadow-2xl p-6 w-80 border border-gray-100">
                {/* Top bar */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎤</span>
                    <span className="text-sm font-bold text-primary-700">VoiceCheck</span>
                  </div>
                  <span className="text-xs text-gray-400">Evaluación</span>
                </div>

                {/* Stimulus card */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 text-center mb-4 border border-yellow-100">
                  <div className="text-8xl mb-3">🦁</div>
                  <p className="text-2xl font-bold text-gray-900">LEON</p>
                  <p className="text-xs text-gray-500 mt-1">Di la palabra que ves</p>
                </div>

                {/* Recording button */}
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-1 h-8">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-primary-400 rounded-full"
                        style={{
                          height: `${20 + Math.sin(i * 0.8) * 14}px`,
                          opacity: 0.7 + Math.sin(i * 0.5) * 0.3,
                        }}
                      />
                    ))}
                  </div>
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-5 h-5 bg-white rounded-sm" />
                  </div>
                  <p className="text-xs text-gray-500">Grabando... 0:03</p>
                </div>
              </div>

              {/* Floating badge - result */}
              <div className="absolute -bottom-4 -right-6 bg-success-500 text-white rounded-2xl px-4 py-2 shadow-lg flex items-center gap-2">
                <span className="text-lg">✅</span>
                <div>
                  <p className="text-xs font-bold">¡Correcto!</p>
                  <p className="text-xs opacity-80">Pronunciación típica</p>
                </div>
              </div>

              {/* Floating badge - AI */}
              <div className="absolute -top-4 -left-6 bg-primary-600 text-white rounded-2xl px-3 py-2 shadow-lg">
                <p className="text-xs font-bold">🤖 IA analizando</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
