import React from 'react'
import Plot from 'react-plotly.js'

const comparisonFeatures = [
  'avg_sentence_length',
  'sentence_length_std',
  'type_token_ratio',
  'repeated_bigram_ratio',
  'repeated_trigram_ratio',
  'punctuation_ratio',
  'contraction_ratio',
  'flesch_reading_ease',
]

export default function ModelComparisonView({ modelSummary, onModelClick }) {
  const models = modelSummary.slice(0, 8)
  return (
    <section className="panel wide-panel">
      <div className="panel-title">
        <h2>Model Comparison</h2>
        <span>Average normalized feature profiles</span>
      </div>
      <Plot
        data={models.map((model) => ({
          type: 'bar',
          name: model.model,
          x: comparisonFeatures,
          y: comparisonFeatures.map((feature) => model[`z_${feature}`] ?? 0),
        }))}
        layout={{
          barmode: 'group',
          autosize: true,
          margin: { l: 48, r: 16, t: 8, b: 110 },
          yaxis: { title: 'Mean z-score' },
          paper_bgcolor: 'white',
          plot_bgcolor: 'white',
        }}
        config={{ responsive: true, displayModeBar: false }}
        useResizeHandler
        className="plot small-plot"
        onClick={(event) => {
          const model = event.points?.[0]?.data?.name
          if (model) onModelClick(model)
        }}
      />
    </section>
  )
}
