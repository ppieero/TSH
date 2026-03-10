import React from 'react'
import { useLocale } from '@/lib/i18n'

interface PatternTableProps {
  patterns: Array<{
    code: string
    name: string
    description: string
    examples: string
  }>
  title: string
  columns: {
    code: string
    name: string
    description: string
    examples: string
  }
  bgClass: string
}

function PatternTable({ patterns, title, columns, bgClass }: PatternTableProps) {
  return (
    <div className="mb-8">
      <h3 className={`text-sm font-semibold text-white px-4 py-2 rounded-t-lg ${bgClass}`}>
        {title}
      </h3>
      <div className="overflow-x-auto rounded-b-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                {columns.code}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                {columns.name}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {columns.description}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                {columns.examples}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {patterns.map((pattern, idx) => (
              <tr key={pattern.code} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3">
                  <code className="text-xs font-mono font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                    {pattern.code}
                  </code>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{pattern.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{pattern.description}</td>
                <td className="px-4 py-3 text-sm text-gray-500 font-mono">{pattern.examples}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface ScientificBasisProps {
  condensed?: boolean
}

export function ScientificBasis({ condensed = false }: ScientificBasisProps) {
  const { t } = useLocale()

  const omissions = t.scientificBasis.patterns.filter((p) => p.code.startsWith('EM'))
  const assimilations = t.scientificBasis.patterns.filter((p) => p.code.startsWith('EA'))
  const substitutions = t.scientificBasis.patterns.filter((p) => p.code.startsWith('ES'))

  return (
    <section className="py-20 bg-white" id="base-cientifica">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t.scientificBasis.title}
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-4">
            {t.scientificBasis.subtitle}
          </p>
          <p className="text-base text-gray-600 max-w-3xl mx-auto">
            {t.scientificBasis.description}
          </p>
        </div>

        {/* Pattern stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="text-3xl font-bold text-blue-600">7</div>
            <div className="text-sm text-gray-600 mt-1">{t.scientificBasis.categories.omissions}</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-100">
            <div className="text-3xl font-bold text-orange-600">3</div>
            <div className="text-sm text-gray-600 mt-1">{t.scientificBasis.categories.assimilations}</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-100">
            <div className="text-3xl font-bold text-purple-600">6</div>
            <div className="text-sm text-gray-600 mt-1">{t.scientificBasis.categories.substitutions}</div>
          </div>
        </div>

        {condensed ? (
          /* Condensed view: show just a few examples */
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.scientificBasis.columns.code}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.scientificBasis.columns.name}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    {t.scientificBasis.columns.examples}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {t.scientificBasis.patterns.slice(0, 6).map((pattern, idx) => (
                  <tr key={pattern.code} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                        {pattern.code}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{pattern.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono hidden md:table-cell">
                      {pattern.examples}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Full view with all patterns organized by category */
          <>
            <PatternTable
              patterns={omissions}
              title={t.scientificBasis.categories.omissions}
              columns={t.scientificBasis.columns}
              bgClass="bg-blue-600"
            />
            <PatternTable
              patterns={assimilations}
              title={t.scientificBasis.categories.assimilations}
              columns={t.scientificBasis.columns}
              bgClass="bg-orange-600"
            />
            <PatternTable
              patterns={substitutions}
              title={t.scientificBasis.categories.substitutions}
              columns={t.scientificBasis.columns}
              bgClass="bg-purple-600"
            />
          </>
        )}
      </div>
    </section>
  )
}
