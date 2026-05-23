import React, { useEffect, useRef, useState } from 'react'
import Plot from 'react-plotly.js'

const palette = ['#1f77b4', '#d62728', '#2ca02c', '#9467bd', '#ff7f0e', '#17becf', '#8c564b', '#7f7f7f', '#bcbd22']

export default function WritingStyleMap({ points, colorBy, selectedCluster, selectedPoint, projection, onPointClick }) {
  const [revision, setRevision] = useState(0)
  const initialized = useRef(false)

  useEffect(() => {
    if (points.length > 0 && !initialized.current) {
      initialized.current = true
      // Force Plotly.react() after initial newPlot() to properly bind click handlers
      setRevision(1)
    }
  }, [points.length])

  const groups = [...new Set(points.map((p) => String(p[colorBy] ?? 'unknown')))]
  const traces = groups.map((group, index) => {
    const rows = points.filter((p) => String(p[colorBy] ?? 'unknown') === group)
    return {
      type: 'scattergl',
      mode: 'markers',
      name: group,
      x: rows.map((p) => p.projection_x),
      y: rows.map((p) => p.projection_y),
      customdata: rows.map((p) => p.sample_id),
      text: rows.map((p) => `${p.model}<br>${p.domain}<br>${p.attack}<br>${p.word_count} words<br>cluster ${p.cluster}`),
      hovertemplate: '%{text}<extra></extra>',
      marker: {
        color: palette[index % palette.length],
        size: rows.map((p) => p.sample_id === selectedPoint?.sample_id ? 13 : 7),
        opacity: rows.map((p) => selectedCluster === null || p.cluster === selectedCluster ? 0.86 : 0.16),
        line: { width: rows.map((p) => p.sample_id === selectedPoint?.sample_id ? 2 : 0), color: '#111827' },
      },
    }
  })

  return (
    <section className="panel map-panel">
      <div className="panel-title">
        <h2>Writing Style Map</h2>
        <span>{projection ? projection.toUpperCase() : ''} &middot; {points.length} samples</span>
      </div>
      <Plot
        data={traces}
        revision={revision}
        layout={{
          autosize: true,
          margin: { l: 42, r: 18, t: 10, b: 42 },
          dragmode: 'pan',
          xaxis: { title: 'Projection X', zeroline: false },
          yaxis: { title: 'Projection Y', zeroline: false },
          legend: { orientation: 'h', y: -0.2 },
          paper_bgcolor: 'white',
          plot_bgcolor: 'white',
        }}
        config={{ responsive: true, displayModeBar: true, displaylogo: false }}
        useResizeHandler
        className="plot"
        onClick={(event) => {
          const id = event.points?.[0]?.customdata
          if (id) onPointClick(id)
        }}
      />
    </section>
  )
}
