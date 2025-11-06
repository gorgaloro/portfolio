import { type Metadata } from 'next'
import { headers, cookies } from 'next/headers'
import { Providers } from '@/app/providers'
import { Layout } from '@/components/Layout'

import '@/styles/tailwind.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://allenwalker.info'),
  title: {
    template: '%s | Allen Walker | Systems in Motion',
    default: 'Allen Walker | Systems in Motion',
  },
  description: 'Allen Walker — Systems in Motion.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
    shortcut: ['/favicon.ico'],
  },
  openGraph: {
    title: 'Allen Walker | Systems in Motion',
    description: 'Allen Walker — Systems in Motion.',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'Allen Walker | Systems in Motion',
    images: [
      {
        url: '/about-hero.jpg',
        width: 1200,
        height: 630,
        alt: 'Allen Walker — Systems in Motion',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Allen Walker | Systems in Motion',
    description: 'Allen Walker — Systems in Motion.',
    images: ['/about-hero.jpg'],
  },
  alternates: {
    types: {
      'application/rss+xml': `${process.env.NEXT_PUBLIC_SITE_URL}/feed.xml`,
    },
  },
}

export const dynamic = 'force-dynamic'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const h = headers()
  const c = cookies()
  const isAdminHeader = h.get('x-admin-layout') === '1'
  const isAdminCookie = c.get('admin_layout')?.value === '1'
  const isAdmin = isAdminHeader || isAdminCookie

  if (isAdmin) {
    return (
      <html lang="en" className="h-full antialiased" suppressHydrationWarning>
        <body className="h-full bg-white">
          <Providers>
            {children}
          </Providers>
        </body>
      </html>
    )
  }

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex h-full bg-zinc-50 dark:bg-black">
        <Providers>
          <div className="flex w-full">
            <Layout>{children}</Layout>
          </div>
        </Providers>
      </body>
    </html>
  )
}
