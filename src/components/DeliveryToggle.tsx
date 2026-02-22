"use client"

import { useState } from 'react'

export default function DeliveryToggle() {
  const [view, setView] = useState<'Agile' | 'Waterfall'>('Agile')

  const steps: Record<'Agile' | 'Waterfall', string[]> = {
    Agile: [
      'Initiate & Align',
      'Shape & Prioritize',
      'Plan & Sprint',
      'Deliver & Iterate',
      'Measure & Retro',
      'Adapt & Scale',
    ],
    Waterfall: [
      'Initiation',
      'Planning',
      'Requirements Definition',
      'Execution',
      'Monitoring & Control',
      'Closeout',
    ],
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-12">
      <div className="flex justify-center mb-8">
        <button
          type="button"
          onClick={() => setView('Agile')}
          className={`px-4 py-2 rounded-l-md border ${
            view === 'Agile' ? 'bg-black text-white' : 'bg-white text-black'
          }`}
        >
          Agile
        </button>
        <button
          type="button"
          onClick={() => setView('Waterfall')}
          className={`px-4 py-2 rounded-r-md border ${
            view === 'Waterfall' ? 'bg-black text-white' : 'bg-white text-black'
          }`}
        >
          Waterfall
        </button>
      </div>

      <div className="space-y-4">
        {steps[view].map((step, index) => (
          <div
            key={index}
            className="flex items-center justify-center border border-gray-300 rounded-md py-3 text-lg font-medium bg-white shadow-sm"
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  )
}
