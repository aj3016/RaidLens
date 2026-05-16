import React from 'react'

const visibleFeatures = [
  'word_count',
  'sentence_count',
  'avg_sentence_length',
  'sentence_length_std',
  'type_token_ratio',
  'punctuation_ratio',
  'contraction_ratio',
  'flesch_reading_ease',
]

export default function TextDetailPanel({ sample, neighbors, onNeighborClick, loading }) {
  return (
    <section className="panel detail-panel">
      <div className="panel-title">
        <h2>Text Detail</h2>
        {loading && <span>Loading...</span>}
      </div>
      {!sample ? (
        <p className="muted">Click a point to inspect its text, features, and nearby samples.</p>
      ) : (
        <>
          <div className="detail-grid">
            <span>Label <strong>{sample.label}</strong></span>
            <span>Model <strong>{sample.model}</strong></span>
            <span>Domain <strong>{sample.domain}</strong></span>
            <span>Attack <strong>{sample.attack}</strong></span>
            <span>Decoding <strong>{sample.decoding}</strong></span>
            <span>Cluster <strong>{sample.cluster}</strong></span>
          </div>
          <h3>Features</h3>
          <div className="feature-list">
            {visibleFeatures.map((feature) => (
              <span key={feature}>{feature}: <strong>{Number(sample[feature] ?? 0).toFixed(3)}</strong></span>
            ))}
          </div>
          <h3>Excerpt</h3>
          <p className="text-excerpt">{sample.generation || sample.excerpt}</p>
          <h3>Nearest Neighbors</h3>
          <div className="neighbor-list">
            {neighbors.map((neighbor) => (
              <button key={neighbor.sample_id} onClick={() => onNeighborClick(neighbor.sample_id)}>
                <strong>{neighbor.model}</strong> · cluster {neighbor.cluster} · d={neighbor.distance.toFixed(2)}
                <span>{neighbor.excerpt}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
