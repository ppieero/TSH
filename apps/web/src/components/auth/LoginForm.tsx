'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface LoginFormProps {
  locale: string
  redirectTo?: string
}

export function LoginForm({ locale, redirectTo }: LoginFormProps) {
  const { t } = useLocale()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(t.auth.loginError)
        return
      }

      router.push(redirectTo || `/${locale}/dashboard`)
      router.refresh()
    } catch {
      setError(t.auth.loginError)
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
        label={t.auth.email}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        placeholder="tu@email.com"
      />

      <Input
        label={t.auth.password}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
        placeholder="••••••••"
      />

      <div className="flex items-center justify-end">
        <Link
          href={`/${locale}/auth/reset`}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          {t.auth.forgotPassword}
        </Link>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        className="w-full"
      >
        {loading ? t.auth.loggingIn : t.auth.login}
      </Button>

      <p className="text-center text-sm text-gray-600">
        {t.auth.noAccount}{' '}
        <Link href={`/${locale}/auth/registro`} className="text-primary-600 hover:text-primary-700 font-medium">
          {t.auth.register}
        </Link>
      </p>
    </form>
  )
}
