import React from 'react'
import Plot from 'react-plotly.js'

export default function FeatureProfileHeatmap({ profiles, features, onFeatureClick }) {
  const columns = features.slice(0, 12)
  return (
    <section className="panel heatmap-panel">
      <div className="panel-title">
        <h2>Feature Profile Heatmap</h2>
        <span>Cluster z-means</span>
      </div>
      <Plot
        data={[{
          type: 'heatmap',
          x: columns,
          y: profiles.map((p) => `C${p.cluster}`),
          z: profiles.map((p) => columns.map((f) => p[f] ?? 0)),
          colorscale: 'RdBu',
          reversescale: true,
          zmid: 0,
        }]}
        layout={{ autosize: true, margin: { l: 52, r: 20, t: 8, b: 92 }, paper_bgcolor: 'white' }}
        config={{ responsive: true, displayModeBar: false }}
        useResizeHandler
        className="plot small-plot"
        onClick={(event) => {
          const feature = event.points?.[0]?.x
          if (feature) onFeatureClick(feature)
        }}
      />
    </section>
  )
}
