'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

interface RegisterFormProps {
  locale: string
}

const COUNTRIES = [
  { value: 'AR', label: 'Argentina' },
  { value: 'BO', label: 'Bolivia' },
  { value: 'BR', label: 'Brasil' },
  { value: 'CL', label: 'Chile' },
  { value: 'CO', label: 'Colombia' },
  { value: 'CR', label: 'Costa Rica' },
  { value: 'CU', label: 'Cuba' },
  { value: 'DO', label: 'República Dominicana' },
  { value: 'EC', label: 'Ecuador' },
  { value: 'ES', label: 'España' },
  { value: 'GT', label: 'Guatemala' },
  { value: 'HN', label: 'Honduras' },
  { value: 'MX', label: 'México' },
  { value: 'NI', label: 'Nicaragua' },
  { value: 'PA', label: 'Panamá' },
  { value: 'PE', label: 'Perú' },
  { value: 'PR', label: 'Puerto Rico' },
  { value: 'PY', label: 'Paraguay' },
  { value: 'SV', label: 'El Salvador' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'VE', label: 'Venezuela' },
  { value: 'OTHER', label: 'Otro' },
]

export function RegisterForm({ locale }: RegisterFormProps) {
  const { t } = useLocale()
  const router = useRouter()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    country_code: '',
    preferred_language: locale,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError(t.auth.passwordsDoNotMatch)
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      // 1. Create Supabase auth user
      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            country_code: formData.country_code,
            preferred_language: formData.preferred_language,
          },
        },
      })

      if (authError) {
        setError(authError.message || t.auth.registerError)
        return
      }

      // 2. Call API to create guardian profile
      try {
        await api.register({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          country_code: formData.country_code,
          preferred_language: formData.preferred_language as 'es' | 'en' | 'pt',
        })
      } catch {
        // API registration may fail if user already created via Supabase trigger
        // Continue to dashboard anyway
      }

      router.push(`/${locale}/dashboard`)
      router.refresh()
    } catch {
      setError(t.auth.registerError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
          <p className="text-sm text-danger-700">{error}</p>
        </div>
      )}

      <Input
        label={t.auth.fullName}
        value={formData.full_name}
        onChange={(e) => handleChange('full_name', e.target.value)}
        required
        placeholder="Juan García"
      />

      <Input
        label={t.auth.email}
        type="email"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        required
        autoComplete="email"
        placeholder="tu@email.com"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={t.auth.password}
          type="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          required
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
        />
        <Input
          label={t.auth.confirmPassword}
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          required
          autoComplete="new-password"
          placeholder="Repetir contraseña"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label={t.auth.country}
          value={formData.country_code}
          onChange={(e) => handleChange('country_code', e.target.value)}
          required
          placeholder="Seleccionar país..."
          options={COUNTRIES}
        />
        <Select
          label={t.auth.language}
          value={formData.preferred_language}
          onChange={(e) => handleChange('preferred_language', e.target.value)}
          options={[
            { value: 'es', label: 'Español' },
            { value: 'en', label: 'English' },
            { value: 'pt', label: 'Português' },
          ]}
        />
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        {t.auth.termsAgreement}{' '}
        <Link href={`/${locale}/terminos`} className="text-primary-600 hover:underline">
          {t.auth.termsLink}
        </Link>{' '}
        {t.auth.and}{' '}
        <Link href={`/${locale}/privacidad`} className="text-primary-600 hover:underline">
          {t.auth.privacyLink}
        </Link>
        .
      </p>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        className="w-full"
      >
        {loading ? t.auth.registering : t.auth.register}
      </Button>

      <p className="text-center text-sm text-gray-600">
        {t.auth.hasAccount}{' '}
        <Link href={`/${locale}/auth/login`} className="text-primary-600 hover:text-primary-700 font-medium">
          {t.auth.login}
        </Link>
      </p>
    </form>
  )
}
