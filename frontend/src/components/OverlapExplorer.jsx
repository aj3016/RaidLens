import React from 'react'

export default function OverlapExplorer({ clusters, selectedCluster, onClusterClick }) {
  const ranked = [...clusters].sort((a, b) => b.mixedness - a.mixedness)
  return (
    <section className="panel">
      <div className="panel-title">
        <h2>Overlap Explorer</h2>
        <span>Mixed clusters</span>
      </div>
      <div className="overlap-list">
        {ranked.map((cluster) => (
          <button
            key={cluster.cluster}
            className={selectedCluster === cluster.cluster ? 'active' : ''}
            onClick={() => onClusterClick(cluster.cluster)}
          >
            <strong>Cluster {cluster.cluster} · {cluster.composition_label}</strong>
            <span>mixedness {cluster.mixedness.toFixed(2)}</span>
            <span>{cluster.human_count} human · {cluster.ai_count} AI</span>
          </button>
        ))}
      </div>
    </section>
  )
}
