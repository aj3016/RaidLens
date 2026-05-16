import React, { useEffect, useMemo, useState } from 'react'
import { fetchMetadata, fetchNeighbors, fetchSample, processData } from './api'
import Header from './components/Header'
import SummaryCards from './components/SummaryCards'
import FilterBar from './components/FilterBar'
import WritingStyleMap from './components/WritingStyleMap'
import TextDetailPanel from './components/TextDetailPanel'
import ClusterCompositionChart from './components/ClusterCompositionChart'
import FeatureProfileHeatmap from './components/FeatureProfileHeatmap'
import FeatureDistributionView from './components/FeatureDistributionView'
import ModelComparisonView from './components/ModelComparisonView'
import OverlapExplorer from './components/OverlapExplorer'

const defaultFilters = {
  max_rows: 5000,
  models: [],
  domains: [],
  attacks: ['none'],
  random_seed: 42,
  projection: 'pca',
  num_clusters: 8,
}

export default function App() {
  const [metadata, setMetadata] = useState({ models: [], domains: [], attacks: ['none'], decoding: [] })
  const [filters, setFilters] = useState(defaultFilters)
  const [points, setPoints] = useState([])
  const [summary, setSummary] = useState({})
  const [clusterSummary, setClusterSummary] = useState([])
  const [featureProfiles, setFeatureProfiles] = useState([])
  const [modelSummary, setModelSummary] = useState([])
  const [featureNames, setFeatureNames] = useState([])
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [neighbors, setNeighbors] = useState([])
  const [selectedCluster, setSelectedCluster] = useState(null)
  const [selectedFeature, setSelectedFeature] = useState('sentence_length_std')
  const [colorBy, setColorBy] = useState('label')
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [warnings, setWarnings] = useState([])

  useEffect(() => {
    fetchMetadata().then(setMetadata).catch((err) => setError(err.message))
  }, [])

  const runProcess = async (nextFilters = filters) => {
    setLoading(true)
    setError('')
    setWarnings([])
    try {
      const data = await processData(nextFilters)
      setPoints(data.points || [])
      setSummary(data.summary || {})
      setClusterSummary(data.cluster_summary || [])
      setFeatureProfiles(data.feature_profiles || [])
      setModelSummary(data.model_summary || [])
      setFeatureNames(data.feature_names || [])
      setSelectedCluster(null)
      setSelectedPoint(null)
      setNeighbors([])
      setWarnings(data.warnings || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runProcess(defaultFilters)
  }, [])

  const selectPoint = async (sampleId) => {
    setDetailLoading(true)
    setError('')
    try {
      const [sample, neighborData] = await Promise.all([fetchSample(sampleId), fetchNeighbors(sampleId, 8)])
      setSelectedPoint(sample)
      setNeighbors(neighborData.neighbors || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setDetailLoading(false)
    }
  }

  const displayPoints = useMemo(() => points, [points])

  const handleClusterClick = (cluster) => {
    const numeric = Number(cluster)
    setSelectedCluster(selectedCluster === numeric ? null : numeric)
    setColorBy('cluster')
  }

  const handleModelClick = (model) => {
    setColorBy('model')
    const first = points.find((p) => p.model === model)
    if (first) selectPoint(first.sample_id)
  }

  return (
    <div className="app-shell">
      <Header />
      <main>
        <SummaryCards summary={summary} />
        <FilterBar
          filters={filters}
          metadata={metadata}
          colorBy={colorBy}
          setColorBy={setColorBy}
          onFilterChange={setFilters}
          onProcess={() => runProcess(filters)}
          onReset={() => {
            setFilters(defaultFilters)
            runProcess(defaultFilters)
          }}
          loading={loading}
        />
        {error && <div className="notice error">{error}</div>}
        {warnings.map((warning) => <div className="notice" key={warning}>{warning}</div>)}
        <div className="dashboard-grid">
          <WritingStyleMap
            points={displayPoints}
            colorBy={colorBy}
            selectedCluster={selectedCluster}
            selectedPoint={selectedPoint}
            onPointClick={selectPoint}
          />
          <TextDetailPanel sample={selectedPoint} neighbors={neighbors} onNeighborClick={selectPoint} loading={detailLoading} />
          <ClusterCompositionChart clusters={clusterSummary} selectedCluster={selectedCluster} onClusterClick={handleClusterClick} />
          <FeatureProfileHeatmap profiles={featureProfiles} features={featureNames} onFeatureClick={setSelectedFeature} />
          <FeatureDistributionView
            points={displayPoints}
            feature={selectedFeature}
            setFeature={setSelectedFeature}
            featureNames={featureNames}
            groupBy={colorBy}
          />
          <OverlapExplorer clusters={clusterSummary} selectedCluster={selectedCluster} onClusterClick={handleClusterClick} />
          <ModelComparisonView modelSummary={modelSummary} onModelClick={handleModelClick} />
        </div>
      </main>
    </div>
  )
}
