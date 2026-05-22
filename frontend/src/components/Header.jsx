import React from 'react'

export default function Header({ onBack, summary = {}, filters = {} }) {
  const has = !!summary.total_samples

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-brand">
          {onBack && <button className="header-back" onClick={onBack}>← Configure</button>}
          <h1>RAID<span className="header-accent">Lens</span></h1>
          <p>Visual Analytics of Human and AI-Generated Text Overlap</p>
          <div className="header-badge">RAID Dataset &middot; Exploratory Analysis</div>
        </div>

        {has && (
          <div className="header-meta">
            <div className="header-stats">
              <div className="header-stat-item">
                <strong>{summary.total_samples?.toLocaleString()}</strong>
                <span>Total</span>
              </div>
              <div className="header-stat-sep" />
              <div className="header-stat-item">
                <strong>{summary.human_samples}</strong>
                <span>Human</span>
              </div>
              <div className="header-stat-item">
                <strong>{summary.ai_samples}</strong>
                <span>AI</span>
              </div>
              <div className="header-stat-sep" />
              <div className="header-stat-item">
                <strong>{summary.num_models}</strong>
                <span>Models</span>
              </div>
              <div className="header-stat-item">
                <strong>{summary.num_domains}</strong>
                <span>Domains</span>
              </div>
              <div className="header-stat-item">
                <strong>{filters.num_clusters}</strong>
                <span>Clusters</span>
              </div>
              <div className="header-stat-sep" />
              <div className="header-stat-item">
                <strong>{(summary.projection || filters.projection || 'PCA').toUpperCase()}</strong>
                <span>Projection</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
