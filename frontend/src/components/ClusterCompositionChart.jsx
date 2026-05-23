import React, { useMemo, useState } from 'react'
import Plot from 'react-plotly.js'

const compositionOrder = ['AI', 'Mostly AI', 'Mixed', 'Mostly Human', 'Human']

export default function ClusterCompositionChart({ clusters, selectedCluster, onClusterClick }) {
  const [compositionView, setCompositionView] = useState(false)
  const grouped = useMemo(() => {
    const totals = Object.fromEntries(
      compositionOrder.map((label) => [label, { label, human_count: 0, ai_count: 0 }]),
    )
    clusters.forEach((cluster) => {
      const label = cluster.composition_label || 'Mixed'
      if (!totals[label]) totals[label] = { label, human_count: 0, ai_count: 0 }
      totals[label].human_count += cluster.human_count || 0
      totals[label].ai_count += cluster.ai_count || 0
    })
    return compositionOrder.map((label) => totals[label]).filter((row) => row.human_count || row.ai_count)
  }, [clusters])

  const rows = compositionView ? grouped : clusters
  const ids = compositionView ? rows.map((row) => row.label) : rows.map((c) => c.cluster)

  return (
    <section className="panel">
      <div className="panel-title">
        <h2>Cluster Composition</h2>
        <div className="panel-title-actions">
          <button
            className={compositionView ? 'mini-toggle active' : 'mini-toggle'}
            onClick={() => setCompositionView((value) => !value)}
            title="Toggle 5-way cluster composition view"
          >
            {compositionView ? 'Clusters' : '5-way'}
          </button>
          <span>{compositionView ? 'Composition groups' : selectedCluster === null ? 'All clusters' : `Cluster ${selectedCluster}`}</span>
        </div>
      </div>
      <Plot
        data={[
          { type: 'bar', name: 'Human', x: ids, y: rows.map((c) => c.human_count), marker: { color: '#1f77b4' } },
          { type: 'bar', name: 'AI', x: ids, y: rows.map((c) => c.ai_count), marker: { color: '#d62728' } },
        ]}
        layout={{
          barmode: 'stack',
          autosize: true,
          margin: { l: 42, r: 16, t: 8, b: 42 },
          xaxis: { title: compositionView ? 'Composition' : 'Cluster' },
          yaxis: { title: 'Samples' },
          paper_bgcolor: 'white',
          plot_bgcolor: 'white',
        }}
        config={{ responsive: true, displayModeBar: false }}
        useResizeHandler
        className="plot small-plot"
        onClick={(event) => {
          if (!compositionView) onClusterClick(event.points?.[0]?.x)
        }}
      />
    </section>
  )
}
