'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react'
import {
  Bars3Icon,
  CalendarIcon,
  ChartPieIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

type NavItem = { name: string; href: string; icon: any; current?: boolean }

const baseNav: NavItem[] = [
  { name: 'Referrals', href: '/admin', icon: HomeIcon },
  { name: 'Pages', href: '/admin/pages', icon: FolderIcon },
  { name: 'Config', href: '/admin/config', icon: ChartPieIcon },
]

type AdminShellProps = {
  title?: string
  children: React.ReactNode
  aside?: React.ReactNode
  current?: string // matches nav name to highlight
}

export default function AdminShell({ title, children, aside, current = 'Referrals' }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigation = baseNav.map((n) => ({ ...n, current: n.name === current }))

  const hasAside = !!aside

  useEffect(() => {
    document.body.classList.add('admin-shell')
    return () => {
      document.body.classList.remove('admin-shell')
    }
  }, [])

  return (
    <div>
      <style jsx global>{`
        body.admin-shell header,
        body.admin-shell footer,
        body.admin-shell .fixed.inset-0 { display: none !important; }
        body.admin-shell { background: #fff !important; }
      `}</style>
      <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
        <DialogBackdrop transition className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0" />
        <div className="fixed inset-0 flex">
          <DialogPanel transition className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full">
            <TransitionChild>
              <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                </button>
              </div>
            </TransitionChild>
            <div className="relative flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
              <div className="relative flex h-16 shrink-0 items-center">
                <img alt="Your Company" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600" className="h-8 w-auto" />
              </div>
              <nav className="relative flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <a
                            href={item.href}
                            className={classNames(
                              item.current ? 'bg-gray-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                              'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                            )}
                          >
                            <item.icon
                              aria-hidden="true"
                              className={classNames(item.current ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600', 'size-6 shrink-0')}
                            />
                            {item.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="relative flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
          <div className="relative flex h-16 shrink-0 items-center">
            <img alt="Your Company" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600" className="h-8 w-auto" />
          </div>
          <nav className="relative flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className={classNames(
                          item.current ? 'bg-gray-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                          'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                        )}
                      >
                        <item.icon
                          aria-hidden="true"
                          className={classNames(item.current ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600', 'size-6 shrink-0')}
                        />
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-xs sm:px-6 lg:hidden">
        <button type="button" onClick={() => setSidebarOpen(true)} className="relative -m-2.5 p-2.5 text-gray-700 lg:hidden">
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon aria-hidden="true" className="size-6" />
        </button>
        <div className="relative flex-1 text-sm/6 font-semibold text-gray-900">{title || 'Admin'}</div>
        <a href="#" className="relative">
          <span className="sr-only">Your profile</span>
          <img
            alt=""
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            className="size-8 rounded-full bg-gray-50 outline -outline-offset-1 outline-black/5"
          />
        </a>
      </div>

      <main className="lg:pl-72">
        <div className={classNames(hasAside ? 'xl:pr-96' : '')}>
          <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-6">
            {children}
          </div>
        </div>
      </main>

      {hasAside && (
        <aside className="fixed inset-y-0 right-0 hidden w-96 overflow-y-auto border-l border-gray-200 px-4 py-6 sm:px-6 lg:px-8 xl:block">
          {aside}
        </aside>
      )}
    </div>
  )
}
