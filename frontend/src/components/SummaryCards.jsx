import React from 'react'

const cards = [
  ['total_samples',  'Total Samples'],
  ['human_samples',  'Human'],
  ['ai_samples',     'AI'],
  ['num_models',     'Models'],
  ['num_domains',    'Domains'],
  ['num_clusters',   'Clusters'],
]

export default function SummaryCards({ summary }) {
  return (
    <section className="summary-grid">
      {cards.map(([key, label]) => (
        <div className="summary-card" key={key}>
          <span>{label}</span>
          <strong>{summary?.[key] ?? '—'}</strong>
        </div>
      ))}
    </section>
  )
}
