import { type ClassValue, clsx } from 'clsx'

// Simple cn function without clsx dependency
export function cn(...inputs: ClassValue[]): string {
  // Simple implementation without external deps
  return inputs
    .flat()
    .filter(Boolean)
    .map((input) => {
      if (typeof input === 'string') return input
      if (typeof input === 'object' && input !== null) {
        return Object.entries(input)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key)
          .join(' ')
      }
      return ''
    })
    .join(' ')
    .trim()
}

export function calculateAge(birthDate: string): { years: number; months: number; totalMonths: number } {
  const birth = new Date(birthDate)
  const now = new Date()

  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()

  if (months < 0) {
    years -= 1
    months += 12
  }

  if (now.getDate() < birth.getDate()) {
    months -= 1
    if (months < 0) {
      years -= 1
      months += 12
    }
  }

  return {
    years,
    months,
    totalMonths: years * 12 + months,
  }
}

export function formatDate(dateString: string, locale: string = 'es'): string {
  const date = new Date(dateString)
  const localeMap: Record<string, string> = {
    es: 'es-ES',
    en: 'en-US',
    pt: 'pt-BR',
  }

  return date.toLocaleDateString(localeMap[locale] || 'es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatAge(
  years: number,
  months: number,
  locale: string = 'es'
): string {
  const labels: Record<string, { years: string; months: string; and: string }> = {
    es: { years: 'años', months: 'meses', and: 'y' },
    en: { years: 'years', months: 'months', and: 'and' },
    pt: { years: 'anos', months: 'meses', and: 'e' },
  }
  const l = labels[locale] || labels.es

  if (years === 0) return `${months} ${l.months}`
  if (months === 0) return `${years} ${l.years}`
  return `${years} ${l.years} ${l.and} ${months} ${l.months}`
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    typical: 'text-success-700 bg-success-50 border-success-200',
    monitor: 'text-primary-700 bg-primary-50 border-primary-200',
    attention: 'text-warning-700 bg-warning-50 border-warning-200',
    urgent: 'text-danger-700 bg-danger-50 border-danger-200',
  }
  return colors[severity] || colors.typical
}

export function getSeverityBgColor(severity: string): string {
  const colors: Record<string, string> = {
    typical: 'bg-success-500',
    monitor: 'bg-primary-500',
    attention: 'bg-warning-500',
    urgent: 'bg-danger-500',
  }
  return colors[severity] || colors.typical
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
