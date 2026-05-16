# RAIDLens

RAIDLens is an interactive visual analytics dashboard for exploring stylistic overlap between human-written and AI-generated text in the RAID dataset. It is designed for comparison, clustering, and inspection of overlap regions across model, domain, decoding, and attack settings.

This project is not an AI detector. The views are intended to support exploratory analysis and classroom discussion, not classification claims about unseen text.

## Dataset

RAIDLens uses the Hugging Face dataset:

```python
from datasets import load_dataset
ds = load_dataset("liamdugan/raid", "raid")
```

The dataset is large, so the browser never receives the full dataset. The FastAPI backend filters, samples, extracts features, projects, clusters, and caches processed subsets before sending compact point data to the React frontend.

## Project Structure

```text
raidlens/
  backend/
    requirements.txt
    app/
      main.py
      dataset_loader.py
      feature_extraction.py
      analysis.py
      cache.py
      schemas.py
    cache/
  frontend/
    package.json
    index.html
    src/
      main.jsx
      App.jsx
      api.js
      styles.css
      components/
```

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Optional UMAP support:

```bash
pip install umap-learn
```

On macOS or Linux, activate with:

```bash
source .venv/bin/activate
```

The API runs at `http://localhost:8000`.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The dashboard runs at `http://localhost:5173`.

## API Endpoints

- `GET /api/health`: returns `{"status": "ok"}`
- `GET /api/metadata`: returns available models, domains, attacks, and decoding values from a bounded sample
- `POST /api/process`: filters, samples, extracts features, projects, clusters, caches, and returns dashboard data
- `GET /api/sample/{sample_id}`: returns full text and details for one selected sample
- `GET /api/neighbors/{sample_id}?k=8`: returns nearest neighbors in standardized feature space

Default processing uses `attack = ["none"]`, `max_rows = 5000`, PCA projection, `k = 8` clusters, and random seed `42`.

## Processing Pipeline

1. Load RAID from Hugging Face with `datasets`.
2. Extract robustly available columns: `generation`, `model`, `domain`, `attack`, `decoding`, `repetition_penalty`, `title`, and `prompt`.
3. Treat `model == "human"` as human; all other model values are AI.
4. Filter attacks, models, and domains. If models or domains are empty, select a balanced manageable subset automatically.
5. Extract lightweight regex-based text features without spaCy or heavy NLP dependencies.
6. Standardize numeric features with `StandardScaler`.
7. Compute a 2D PCA projection by default. UMAP is attempted when requested and installed.
8. Cluster with KMeans.
9. Compute cluster composition, feature profiles, model summaries, and nearest-neighbor state.
10. Cache processed results in `backend/cache`.

## Dashboard Views

- Writing Style Map: interactive Plotly scatterplot of projected text samples
- Text Detail Panel: selected sample metadata, features, full text, and nearest neighbors
- Cluster Composition Chart: stacked human vs AI counts per cluster
- Feature Profile Heatmap: normalized cluster-level feature means
- Feature Distribution View: boxplots grouped by the current color field
- Model Comparison View: normalized feature profiles by model
- Overlap Explorer: clusters ranked by human/AI mixedness

## Limitations

- Feature extraction is intentionally simple and transparent; it uses regex tokenization and approximate syllable counts.
- PCA and KMeans reveal structure in the selected feature space, not ground truth authorship.
- Hugging Face download time depends on network speed and local dataset cache state.
- Cache files can become large for high `max_rows` settings because full text is retained server-side for sample lookup.
- UMAP is optional; if unavailable or failing, the backend falls back to PCA.

## Notes

RAIDLens is built for visual analytics: compare styles, inspect cluster overlap, and explore how model, domain, decoding, and attack filters change the geometry of the dataset. It should not be presented or evaluated as an AI detection system.
