import React, { useEffect, useState } from 'react'
import { fetchMetadata, fetchNeighbors, fetchSample, processData } from './api'
import LandingPage from './components/LandingPage'
import Header from './components/Header'
import WritingStyleMap from './components/WritingStyleMap'
import TextDetailPanel from './components/TextDetailPanel'
import ClusterCompositionChart from './components/ClusterCompositionChart'
import FeatureProfileHeatmap from './components/FeatureProfileHeatmap'
import FeatureDistributionView from './components/FeatureDistributionView'
import ModelComparisonView from './components/ModelComparisonView'
import OverlapExplorer from './components/OverlapExplorer'

export const defaultFilters = {
  max_rows: 5000,
  models: [],
  domains: [],
  attacks: ['none'],
  random_seed: 42,
  projection: 'pca',
  num_clusters: 8,
}

export default function App() {
  const [view, setView] = useState('home')
  const [metadata, setMetadata] = useState({ models: [], domains: [], attacks: ['none'] })
  const [filters, setFilters] = useState(defaultFilters)
  const [colorBy, setColorBy] = useState('label')
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
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [warnings, setWarnings] = useState([])

  useEffect(() => {
    fetchMetadata().then(setMetadata).catch((err) => setError(err.message))
  }, [])

  const runProcess = async (nextFilters) => {
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
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async (newFilters, newColorBy) => {
    setFilters(newFilters)
    setColorBy(newColorBy)
    const ok = await runProcess(newFilters)
    if (ok) setView('results')
  }

  const selectPoint = async (sampleId) => {
    setDetailLoading(true)
    setError('')
    try {
      const [sample, neighborData] = await Promise.all([
        fetchSample(sampleId),
        fetchNeighbors(sampleId, 8),
      ])
      setSelectedPoint(sample)
      setNeighbors(neighborData.neighbors || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setDetailLoading(false)
    }
  }

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

  if (view === 'home') {
    return (
      <LandingPage
        metadata={metadata}
        initialFilters={filters}
        initialColorBy={colorBy}
        onStart={handleStart}
        loading={loading}
        error={error}
      />
    )
  }

  return (
    <div className="app-shell">
      <Header
        onBack={() => setView('home')}
        summary={summary}
        filters={filters}
      />
      <main>
        <div className="results-toolbar">
          <div className="results-colorby">
            <span>Color by</span>
            <select value={colorBy} onChange={(e) => setColorBy(e.target.value)}>
              <option value="label">Label</option>
              <option value="model">Model</option>
              <option value="domain">Domain</option>
              <option value="cluster">Cluster</option>
              <option value="attack">Attack</option>
            </select>
          </div>
          {warnings.length > 0 && (
            <div className="results-warnings">
              {warnings.map((w) => <span key={w} className="filter-note">{w}</span>)}
            </div>
          )}
        </div>
        {error && <div className="notice error">{error}</div>}

        <div className="dashboard-grid">
          <WritingStyleMap
            points={points}
            colorBy={colorBy}
            selectedCluster={selectedCluster}
            selectedPoint={selectedPoint}
            projection={summary.projection}
            onPointClick={selectPoint}
          />
          <TextDetailPanel
            sample={selectedPoint}
            neighbors={neighbors}
            onNeighborClick={selectPoint}
            loading={detailLoading}
          />
          <ClusterCompositionChart
            clusters={clusterSummary}
            selectedCluster={selectedCluster}
            onClusterClick={handleClusterClick}
          />
          <OverlapExplorer
            clusters={clusterSummary}
            selectedCluster={selectedCluster}
            onClusterClick={handleClusterClick}
          />
          <FeatureProfileHeatmap
            profiles={featureProfiles}
            features={featureNames}
            onFeatureClick={setSelectedFeature}
          />
          <ModelComparisonView modelSummary={modelSummary} onModelClick={handleModelClick} />
          <FeatureDistributionView
            points={points}
            feature={selectedFeature}
            setFeature={setSelectedFeature}
            featureNames={featureNames}
            groupBy={colorBy}
          />
        </div>
      </main>
    </div>
  )
}
