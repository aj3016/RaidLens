import React, { useState } from 'react'

function PillGroup({ label, value, options, onChange }) {
  const allSelected = options.length > 0 && options.every((o) => value.includes(o))
  const toggle = (opt) =>
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])

  return (
    <div className="pill-group">
      <div className="pill-group-header">
        <span className="pill-group-label">{label}</span>
        <span className="pill-group-count">{value.length > 0 ? `${value.length} selected` : 'all'}</span>
        <button
          type="button"
          className="pill-group-action"
          onClick={() => onChange(allSelected ? [] : [...options])}
        >
          {allSelected ? 'clear' : 'all'}
        </button>
      </div>
      <div className="pill-group-pills">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`pill-g${value.includes(opt) ? ' pill-g-active' : ''}`}
            onClick={() => toggle(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function LandingPage({ metadata, initialFilters, initialColorBy = 'label', onStart, loading, error }) {
  const [filters, setFilters] = useState(initialFilters)
  const [colorBy, setColorBy] = useState(initialColorBy)
  const set = (key, val) => setFilters((f) => ({ ...f, [key]: val }))

  return (
    <div className="landing">
      <div className="landing-blobs" aria-hidden="true">
        <div className="blob blob-teal" />
        <div className="blob blob-indigo" />
        <div className="blob blob-cyan" />
        <div className="blob blob-amber" />
      </div>

      {/* ── Left: branding ── */}
      <div className="landing-left">
        <div className="landing-branding">
          <div className="landing-badge">RAID Dataset · Exploratory Analysis</div>
          <h1 className="landing-title">RAID<span className="landing-accent">Lens</span></h1>
          <p className="landing-sub">Visual Analytics of Human and AI-Generated Text Overlap</p>
          <div className="landing-caps">
            <span>Dimensionality Reduction</span>
            <span>Cluster Analysis</span>
            <span>Feature Profiling</span>
            <span>Style Comparison</span>
          </div>
        </div>
      </div>

      {/* ── Right: config form ── */}
      <div className="landing-right">
        <div className="landing-form">
          <p className="landing-form-title">Configure Analysis</p>

          <div className="landing-controls">
            <label className="landing-field">
              <span>Max rows</span>
              <input type="number" min="100" max="50000" value={filters.max_rows}
                onChange={(e) => set('max_rows', Number(e.target.value))} />
            </label>
            <label className="landing-field">
              <span>Projection</span>
              <select value={filters.projection} onChange={(e) => set('projection', e.target.value)}>
                <option value="pca">PCA</option>
                <option value="umap">UMAP</option>
              </select>
            </label>
            <label className="landing-field">
              <span>Clusters</span>
              <input type="number" min="2" max="50" value={filters.num_clusters}
                onChange={(e) => set('num_clusters', Number(e.target.value))} />
            </label>
            <label className="landing-field">
              <span>Color by</span>
              <select value={colorBy} onChange={(e) => setColorBy(e.target.value)}>
                <option value="label">Label</option>
                <option value="model">Model</option>
                <option value="domain">Domain</option>
                <option value="cluster">Cluster</option>
                <option value="attack">Attack</option>
              </select>
            </label>
          </div>

          <div className="landing-pill-groups">
            <PillGroup
              label="Models"
              value={filters.models}
              options={metadata.models || []}
              onChange={(v) => set('models', v)}
            />
            <PillGroup
              label="Domains"
              value={filters.domains}
              options={metadata.domains || []}
              onChange={(v) => set('domains', v)}
            />
            <PillGroup
              label="Attacks"
              value={filters.attacks}
              options={metadata.attacks?.length ? metadata.attacks : ['none']}
              onChange={(v) => set('attacks', v)}
            />
          </div>

          {error && <div className="notice error" style={{ marginBottom: 12 }}>{error}</div>}

          <button className="landing-cta" onClick={() => onStart(filters, colorBy)} disabled={loading}>
            {loading ? 'Analyzing…' : 'Run Analysis →'}
          </button>
        </div>
      </div>
    </div>
  )
}
