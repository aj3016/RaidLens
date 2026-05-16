const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed: ${response.status}`)
  }
  return response.json()
}

export function fetchMetadata() {
  return request('/api/metadata')
}

export function processData(payload) {
  return request('/api/process', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchSample(sampleId) {
  return request(`/api/sample/${sampleId}`)
}

export function fetchNeighbors(sampleId, k = 8) {
  return request(`/api/neighbors/${sampleId}?k=${k}`)
}
