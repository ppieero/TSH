'use client'

import React, { useState } from 'react'
import { useLocale } from '@/lib/i18n'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { CheckCircle } from 'lucide-react'

export function LanguageRequestForm() {
  const { t } = useLocale()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    language_requested: '',
    country: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.language_requested || !formData.country) {
      setError('Por favor completa todos los campos')
      return
    }

    setLoading(true)
    setError('')

    try {
      await api.submitLanguageRequest(formData)
      setSuccess(true)
    } catch {
      setError('Error al enviar la solicitud. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-20 bg-primary-700" id="idioma">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">{t.languageRequest.title}</h2>
          <p className="text-primary-200">{t.languageRequest.subtitle}</p>
        </div>

        {success ? (
          <div className="bg-white/10 rounded-2xl p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <p className="text-white text-lg font-medium">{t.languageRequest.success}</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-8 shadow-xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Input
                label={t.languageRequest.name}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                placeholder="Juan García"
              />
              <Input
                label={t.languageRequest.email}
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                placeholder="juan@email.com"
              />
              <Select
                label={t.languageRequest.languageRequested}
                value={formData.language_requested}
                onChange={(e) => handleChange('language_requested', e.target.value)}
                required
                placeholder="Seleccionar idioma..."
                options={t.languageRequest.languageOptions.map((lang) => ({
                  value: lang,
                  label: lang,
                }))}
              />
              <Input
                label={t.languageRequest.country}
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                required
                placeholder="México"
              />
            </div>

            {error && (
              <p className="text-danger-600 text-sm mb-4">{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              {loading ? t.languageRequest.submitting : t.languageRequest.submit}
            </Button>
          </form>
        )}
      </div>
    </section>
  )
}
