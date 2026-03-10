'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { CheckCircle } from 'lucide-react'

interface ResetPasswordFormProps {
  locale: string
}

export function ResetPasswordForm({ locale }: ResetPasswordFormProps) {
  const { t } = useLocale()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${locale}/auth/update-password`,
      })

      if (resetError) {
        setError(resetError.message)
        return
      }

      setSuccess(true)
    } catch {
      setError('Error al enviar el email')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="h-12 w-12 text-success-500 mx-auto mb-4" />
        <p className="text-gray-700 text-sm leading-relaxed mb-6">
          {t.auth.resetEmailSent}
        </p>
        <Link
          href={`/${locale}/auth/login`}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          {t.auth.backToLogin}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
          <p className="text-sm text-danger-700">{error}</p>
        </div>
      )}

      <Input
        label={t.auth.email}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        placeholder="tu@email.com"
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        className="w-full"
      >
        {loading ? t.auth.sendingEmail : t.auth.sendResetEmail}
      </Button>

      <p className="text-center text-sm text-gray-600">
        <Link href={`/${locale}/auth/login`} className="text-primary-600 hover:text-primary-700">
          {t.auth.backToLogin}
        </Link>
      </p>
    </form>
  )
}
