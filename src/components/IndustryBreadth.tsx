 

export default function IndustryBreadth() {
  return (
    <section>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Column 1: Delivery & Execution */}
        <div className="h-full rounded-2xl bg-zinc-50/80 ring-1 ring-zinc-900/10 p-6 shadow-sm dark:bg-zinc-900/30 dark:ring-white/10">
          <h3 className="text-lg font-semibold tracking-tight text-zinc-900 mb-4 dark:text-zinc-100">Delivery & Execution</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <li>Product Launch Management</li>
            <li>Agile Project Leadership</li>
            <li>Requirements & Scoping</li>
            <li>Feature Prioritization</li>
            <li>UX & Workflow Design</li>
          </ul>
        </div>

        {/* Column 2: Sales & Customer Success */}
        <div className="h-full rounded-2xl bg-zinc-50/80 ring-1 ring-zinc-900/10 p-6 shadow-sm dark:bg-zinc-900/30 dark:ring-white/10">
          <h3 className="text-lg font-semibold tracking-tight text-zinc-900 mb-4 dark:text-zinc-100">Sales & Customer Success</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <li>GTM Strategy</li>
            <li>CRM Design</li>
            <li>Onboarding Playbooks</li>
            <li>Customer Retention Strategy</li>
            <li>Messaging & Positioning</li>
          </ul>
        </div>

        {/* Column 3: Tech Stack & Systems */}
        <div className="h-full rounded-2xl bg-zinc-50/80 ring-1 ring-zinc-900/10 p-6 shadow-sm dark:bg-zinc-900/30 dark:ring-white/10">
          <h3 className="text-lg font-semibold tracking-tight text-zinc-900 mb-4 dark:text-zinc-100">Tech Stack & Systems</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <li>SaaS Implementation</li>
            <li>Workflow Automation</li>
            <li>AI/ML Use Case Design</li>
            <li>System Architecture</li>
            <li>Application Lifecycle Management</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
