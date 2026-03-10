import React from 'react'
import { useLocale } from '@/lib/i18n'

const CARD_COLORS = [
  'from-blue-50 to-indigo-50 border-blue-100',
  'from-green-50 to-teal-50 border-green-100',
  'from-purple-50 to-pink-50 border-purple-100',
  'from-orange-50 to-red-50 border-orange-100',
]

export function WhoIsItFor() {
  const { t } = useLocale()

  return (
    <section className="py-20 bg-gray-50" id="para-quien">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t.whoIsItFor.title}
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            {t.whoIsItFor.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.whoIsItFor.audiences.map((audience, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${CARD_COLORS[index]} rounded-2xl p-6 border hover:shadow-md transition-shadow`}
            >
              <div className="text-5xl mb-4">{audience.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{audience.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{audience.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
