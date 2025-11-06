import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { headers, cookies } from 'next/headers'

export async function Layout({ children }: { children: React.ReactNode }) {
  const h = await headers()
  const c = await cookies()
  const isAdmin = h.get('x-admin-layout') === '1' || c.get('admin_layout')?.value === '1'

  if (isAdmin) {
    return <main className="flex-auto w-full">{children}</main>
  }

  return (
    <>
      <div className="fixed inset-0 flex justify-center sm:px-8">
        <div className="flex w-full max-w-7xl lg:px-8">
          <div className="w-full bg-white ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-300/20" />
        </div>
      </div>
      <div className="relative flex w-full flex-col">
        <Header />
        <main className="flex-auto">{children}</main>
        <Footer />
      </div>
    </>
  )
}
