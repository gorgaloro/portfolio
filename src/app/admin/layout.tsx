export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <style jsx global>{`
        header, footer { display: none !important; }
        .fixed.inset-0 { display: none !important; }
        body { background: #fff !important; }
      `}</style>
      {children}
    </div>
  )
}
