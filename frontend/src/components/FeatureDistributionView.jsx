import React from 'react'
import Plot from 'react-plotly.js'

export default function FeatureDistributionView({ points, feature, setFeature, featureNames, groupBy }) {
  const groups = [...new Set(points.map((p) => String(p[groupBy] ?? 'unknown')))]
  const traces = groups.map((group) => ({
    type: 'box',
    name: group,
    y: points.filter((p) => String(p[groupBy] ?? 'unknown') === group).map((p) => p[feature]),
    boxpoints: 'outliers',
  }))
  return (
    <section className="panel">
      <div className="panel-title">
        <h2>Feature Distribution</h2>
        <select value={feature} onChange={(e) => setFeature(e.target.value)}>
          {featureNames.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>
      <Plot
        data={traces}
        layout={{
          autosize: true,
          margin: { l: 48, r: 16, t: 8, b: 78 },
          yaxis: { title: feature },
          paper_bgcolor: 'white',
          plot_bgcolor: 'white',
        }}
        config={{ responsive: true, displayModeBar: false }}
        useResizeHandler
        className="plot small-plot"
      />
    </section>
  )
}
