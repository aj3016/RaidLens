from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .analysis import get_neighbors, get_sample, hydrate_state, process_dataframe
from .cache import load_json_cache, save_json_cache
from .dataset_loader import load_filtered_rows, load_metadata
from .schemas import ProcessRequest, ProcessResponse


app = FastAPI(title="RAIDLens API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/metadata")
def metadata():
    cache_params = {"sample_size": 25000, "seed": 42}
    cached = load_json_cache("metadata", cache_params)
    if cached:
        return cached
    try:
        payload = load_metadata()
        save_json_cache("metadata", cache_params, payload)
        return payload
    except Exception as exc:
        # The frontend can still render and let users retry once Hugging Face is reachable.
        return {
            "models": [],
            "domains": [],
            "attacks": ["none"],
            "decoding": [],
            "warning": f"Metadata unavailable: {exc}",
        }


@app.post("/api/process", response_model=ProcessResponse)
def process(req: ProcessRequest):
    params = req.model_dump()
    cached = load_json_cache("process", params)
    if cached:
        hydrate_state(cached)
        return cached
    try:
        df, warnings = load_filtered_rows(
            max_rows=req.max_rows,
            models=req.models,
            domains=req.domains,
            attacks=req.attacks,
            seed=req.random_seed,
        )
        payload = process_dataframe(df, req.projection, req.num_clusters, req.random_seed)
        payload["warnings"] = warnings
        save_json_cache("process", params, payload)
        return payload
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/sample/{sample_id}")
def sample(sample_id: str):
    try:
        return get_sample(sample_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/api/neighbors/{sample_id}")
def neighbors(sample_id: str, k: int = Query(default=8, ge=1, le=30)):
    try:
        return {"neighbors": get_neighbors(sample_id, k)}
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
