'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from '@/lib/i18n'
import { Users, ClipboardList, FileText, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DashboardSidebar() {
  const { locale, t } = useLocale()
  const pathname = usePathname()

  const navItems = [
    {
      href: `/${locale}/dashboard`,
      label: t.nav.dashboard,
      icon: LayoutDashboard,
    },
    {
      href: `/${locale}/dashboard/pacientes`,
      label: t.dashboard.myChildren,
      icon: Users,
    },
    {
      href: `/${locale}/dashboard/evaluaciones`,
      label: t.dashboard.evaluations,
      icon: ClipboardList,
    },
    {
      href: `/${locale}/dashboard/reportes`,
      label: t.dashboard.reports,
      icon: FileText,
    },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-100 min-h-full hidden lg:block">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== `/${locale}/dashboard` && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5',
                  isActive ? 'text-primary-600' : 'text-gray-400'
                )}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
