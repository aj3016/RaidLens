import React from 'react'
import Plot from 'react-plotly.js'

export default function ClusterCompositionChart({ clusters, selectedCluster, onClusterClick }) {
  const ids = clusters.map((c) => c.cluster)
  return (
    <section className="panel">
      <div className="panel-title">
        <h2>Cluster Composition</h2>
        <span>{selectedCluster === null ? 'All clusters' : `Cluster ${selectedCluster}`}</span>
      </div>
      <Plot
        data={[
          { type: 'bar', name: 'Human', x: ids, y: clusters.map((c) => c.human_count), marker: { color: '#1f77b4' } },
          { type: 'bar', name: 'AI', x: ids, y: clusters.map((c) => c.ai_count), marker: { color: '#d62728' } },
        ]}
        layout={{
          barmode: 'stack',
          autosize: true,
          margin: { l: 42, r: 16, t: 8, b: 42 },
          xaxis: { title: 'Cluster' },
          yaxis: { title: 'Samples' },
          paper_bgcolor: 'white',
          plot_bgcolor: 'white',
        }}
        config={{ responsive: true, displayModeBar: false }}
        useResizeHandler
        className="plot small-plot"
        onClick={(event) => onClusterClick(event.points?.[0]?.x)}
      />
    </section>
  )
}
