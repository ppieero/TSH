import React from 'react'
import { useLocale } from '@/lib/i18n'

const STEP_ICONS = ['👤', '👦', '🚀', '🖼️', '🎤', '🤖', '📋']
const STEP_COLORS = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-green-500 to-green-600',
  'from-yellow-500 to-orange-500',
  'from-red-500 to-red-600',
  'from-indigo-500 to-indigo-600',
  'from-teal-500 to-teal-600',
]

export function HowItWorks() {
  const { t } = useLocale()

  return (
    <section className="py-20 bg-white" id="como-funciona">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t.howItWorks.title}
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            {t.howItWorks.subtitle}
          </p>
        </div>

        <div className="relative">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-teal-200" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-6 lg:gap-4">
            {t.howItWorks.steps.map((step, index) => (
              <div key={index} className="relative flex flex-col items-center text-center group">
                {/* Step number + icon */}
                <div className="relative mb-4">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${STEP_COLORS[index]} flex items-center justify-center text-2xl shadow-md group-hover:scale-105 transition-transform`}
                  >
                    {STEP_ICONS[index]}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                    {index + 1}
                  </div>
                </div>

                {/* Text */}
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5 leading-tight">
                  {step.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
