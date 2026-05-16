import React from 'react'

function MultiSelect({ label, value, options, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select
        multiple
        value={value}
        onChange={(event) =>
          onChange(Array.from(event.target.selectedOptions).map((option) => option.value))
        }
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function FilterBar({
  filters,
  metadata,
  colorBy,
  setColorBy,
  onFilterChange,
  onProcess,
  onReset,
  loading,
}) {
  const set = (key, value) => onFilterChange({ ...filters, [key]: value })
  const maxRows = Number(filters.max_rows)
  return (
    <section className="filter-bar">
      <label className="field compact">
        <span>Max rows</span>
        <input type="number" min="100" max="50000" value={filters.max_rows} onChange={(e) => set('max_rows', Number(e.target.value))} />
      </label>
      <MultiSelect label="Models" value={filters.models} options={metadata.models || []} onChange={(v) => set('models', v)} />
      <MultiSelect label="Domains" value={filters.domains} options={metadata.domains || []} onChange={(v) => set('domains', v)} />
      <MultiSelect label="Attacks" value={filters.attacks} options={metadata.attacks?.length ? metadata.attacks : ['none']} onChange={(v) => set('attacks', v)} />
      <label className="field compact">
        <span>Projection</span>
        <select value={filters.projection} onChange={(e) => set('projection', e.target.value)}>
          <option value="pca">PCA</option>
          <option value="umap">UMAP</option>
        </select>
      </label>
      <label className="field compact">
        <span>Clusters</span>
        <input type="number" min="2" max="50" value={filters.num_clusters} onChange={(e) => set('num_clusters', Number(e.target.value))} />
      </label>
      <label className="field compact">
        <span>Color by</span>
        <select value={colorBy} onChange={(e) => setColorBy(e.target.value)}>
          <option value="label">Label</option>
          <option value="model">Model</option>
          <option value="domain">Domain</option>
          <option value="cluster">Cluster</option>
          <option value="attack">Attack</option>
        </select>
      </label>
      <div className="filter-actions">
        {maxRows > 10000 && <span className="warning">Large samples may take a while.</span>}
        <button onClick={onProcess} disabled={loading}>{loading ? 'Processing...' : 'Process'}</button>
        <button className="secondary" onClick={onReset} disabled={loading}>Reset</button>
      </div>
    </section>
  )
}
