from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ProcessRequest(BaseModel):
    max_rows: int = Field(default=5000, ge=100, le=50000)
    models: List[str] = Field(default_factory=list)
    domains: List[str] = Field(default_factory=list)
    attacks: List[str] = Field(default_factory=lambda: ["none"])
    random_seed: int = 42
    projection: str = "pca"
    num_clusters: int = Field(default=8, ge=2, le=50)


class ProcessResponse(BaseModel):
    points: List[Dict[str, Any]]
    summary: Dict[str, Any]
    cluster_summary: List[Dict[str, Any]]
    feature_profiles: List[Dict[str, Any]]
    model_summary: List[Dict[str, Any]]
    feature_names: List[str]
    warnings: Optional[List[str]] = None
