import React, { useEffect, useRef, useState } from 'react'

function MultiCheckList({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggle = (opt) =>
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])
  const allSelected = options.length > 0 && options.every((o) => value.includes(o))

  return (
    <div className={`mcl${open ? ' mcl-open' : ''}`} ref={ref}>
      <button type="button" className="mcl-trigger" onClick={() => setOpen((o) => !o)}>
        <div className="mcl-trigger-left">
          <span className="mcl-label">{label}</span>
          {value.length > 0 && <span className="mcl-count">{value.length}</span>}
        </div>
        <span className="mcl-chevron" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="mcl-dropdown">
          <div className="mcl-dropdown-header">
            <button type="button" className="mcl-toggle-all" onClick={() => onChange(allSelected ? [] : options)}>
              {allSelected ? 'clear' : 'all'}
            </button>
          </div>
          <div className="mcl-list">
            {options.map((opt) => (
              <label key={opt} className={`mcl-item${value.includes(opt) ? ' active' : ''}`}>
                <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )}
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

          <div className="landing-mcl-grid">
            <MultiCheckList label="Models"  value={filters.models}  options={metadata.models  || []}                                   onChange={(v) => set('models', v)} />
            <MultiCheckList label="Domains" value={filters.domains} options={metadata.domains || []}                                   onChange={(v) => set('domains', v)} />
            <MultiCheckList label="Attacks" value={filters.attacks} options={metadata.attacks?.length ? metadata.attacks : ['none']}  onChange={(v) => set('attacks', v)} />
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
