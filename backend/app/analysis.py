from typing import Any, Dict, List, Tuple

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler

from .feature_extraction import FEATURE_NAMES, extract_features


STATE: Dict[str, Any] = {
    "points_df": None,
    "standardized": None,
    "feature_names": FEATURE_NAMES,
    "neighbors": None,
}


def _project(matrix: np.ndarray, projection: str, seed: int) -> np.ndarray:
    if projection.lower() == "umap":
        try:
            import umap  # type: ignore

            return umap.UMAP(n_components=2, random_state=seed).fit_transform(matrix)
        except Exception:
            pass
    return PCA(n_components=2, random_state=seed).fit_transform(matrix)


def _composition(group: pd.DataFrame, column: str) -> Dict[str, int]:
    return group[column].astype(str).value_counts().to_dict()


def _cluster_summary(df: pd.DataFrame) -> List[Dict[str, Any]]:
    rows = []
    for cluster, group in df.groupby("cluster"):
        count = len(group)
        human_count = int((group["label"] == "human").sum())
        ai_count = int((group["label"] == "AI").sum())
        human_pct = human_count / count if count else 0
        ai_pct = ai_count / count if count else 0
        rows.append(
            {
                "cluster": int(cluster),
                "count": int(count),
                "human_count": human_count,
                "ai_count": ai_count,
                "human_pct": human_pct,
                "ai_pct": ai_pct,
                "mixedness": 1 - abs(human_pct - ai_pct),
                "model_composition": _composition(group, "model"),
                "domain_composition": _composition(group, "domain"),
            }
        )
    return sorted(rows, key=lambda row: row["cluster"])


def _feature_profiles(df: pd.DataFrame, z_feature_cols: List[str]) -> List[Dict[str, Any]]:
    profiles = []
    for cluster, group in df.groupby("cluster"):
        row = {"cluster": int(cluster)}
        for col in z_feature_cols:
            row[col.replace("z_", "")] = float(group[col].mean())
        profiles.append(row)
    return sorted(profiles, key=lambda row: row["cluster"])


def _model_summary(df: pd.DataFrame, feature_names: List[str], z_feature_cols: List[str]) -> List[Dict[str, Any]]:
    rows = []
    for model, group in df.groupby("model"):
        row = {"model": str(model), "count": int(len(group))}
        for feature in feature_names:
            row[feature] = float(group[feature].mean())
        for col in z_feature_cols:
            row[f"z_{col.replace('z_', '')}"] = float(group[col].mean())
        rows.append(row)
    return sorted(rows, key=lambda row: (-row["count"], row["model"]))


def process_dataframe(df: pd.DataFrame, projection: str, num_clusters: int, seed: int) -> Dict[str, Any]:
    feature_rows = [extract_features(text) for text in df["generation"].fillna("").astype(str)]
    feature_df = pd.DataFrame(feature_rows).fillna(0.0)
    work = pd.concat([df.reset_index(drop=True), feature_df], axis=1)

    scaler = StandardScaler()
    numeric = work[FEATURE_NAMES].replace([np.inf, -np.inf], 0).fillna(0)
    standardized = scaler.fit_transform(numeric)
    projection_xy = _project(standardized, projection, seed)

    clusters = KMeans(n_clusters=min(num_clusters, len(work)), n_init=10, random_state=seed).fit_predict(standardized)
    work["projection_x"] = projection_xy[:, 0]
    work["projection_y"] = projection_xy[:, 1]
    work["cluster"] = clusters.astype(int)
    for idx, feature in enumerate(FEATURE_NAMES):
        work[f"z_{feature}"] = standardized[:, idx]

    z_feature_cols = [f"z_{f}" for f in FEATURE_NAMES]
    cluster_summary = _cluster_summary(work)
    feature_profiles = _feature_profiles(work, z_feature_cols)
    model_summary = _model_summary(work, FEATURE_NAMES, z_feature_cols)

    point_cols = [
        "sample_id", "label", "model", "domain", "attack", "decoding",
        "repetition_penalty", "title", "prompt", "projection_x", "projection_y",
        "cluster", *FEATURE_NAMES,
    ]
    points = work[point_cols].copy()
    points["excerpt"] = work["generation"].fillna("").astype(str).str.slice(0, 260)

    STATE["points_df"] = work
    STATE["standardized"] = standardized
    STATE["neighbors"] = NearestNeighbors(n_neighbors=min(50, len(work)), metric="euclidean").fit(standardized)

    summary = {
        "total_samples": int(len(work)),
        "human_samples": int((work["label"] == "human").sum()),
        "ai_samples": int((work["label"] == "AI").sum()),
        "num_models": int(work["model"].nunique()),
        "num_domains": int(work["domain"].nunique()),
        "num_clusters": int(work["cluster"].nunique()),
        "projection": projection,
    }
    return {
        "points": points.replace({np.nan: None}).to_dict(orient="records"),
        "summary": summary,
        "cluster_summary": cluster_summary,
        "feature_profiles": feature_profiles,
        "model_summary": model_summary,
        "feature_names": FEATURE_NAMES,
        "_state_records": work.replace({np.nan: None}).to_dict(orient="records"),
        "_standardized": standardized.tolist(),
    }


def hydrate_state(payload: Dict[str, Any]) -> None:
    records = payload.get("_state_records")
    standardized = payload.get("_standardized")
    if not records or standardized is None:
        return
    work = pd.DataFrame(records)
    matrix = np.asarray(standardized, dtype=float)
    STATE["points_df"] = work
    STATE["standardized"] = matrix
    STATE["neighbors"] = NearestNeighbors(n_neighbors=min(50, len(work)), metric="euclidean").fit(matrix)


def get_sample(sample_id: str) -> Dict[str, Any]:
    df = STATE.get("points_df")
    if df is None:
        raise KeyError("No processed data is loaded yet.")
    row = df[df["sample_id"] == sample_id]
    if row.empty:
        raise KeyError(sample_id)
    return row.iloc[0].replace({np.nan: None}).to_dict()


def get_neighbors(sample_id: str, k: int = 8) -> List[Dict[str, Any]]:
    df = STATE.get("points_df")
    standardized = STATE.get("standardized")
    neighbors = STATE.get("neighbors")
    if df is None or standardized is None or neighbors is None:
        raise KeyError("No processed data is loaded yet.")
    matches = df.index[df["sample_id"] == sample_id].tolist()
    if not matches:
        raise KeyError(sample_id)
    idx = matches[0]
    distances, indices = neighbors.kneighbors([standardized[idx]], n_neighbors=min(k + 1, len(df)))
    results = []
    for distance, neighbor_idx in zip(distances[0], indices[0]):
        if neighbor_idx == idx:
            continue
        row = df.iloc[int(neighbor_idx)]
        results.append(
            {
                "sample_id": row["sample_id"],
                "distance": float(distance),
                "label": row["label"],
                "model": row["model"],
                "domain": row["domain"],
                "attack": row["attack"],
                "cluster": int(row["cluster"]),
                "word_count": float(row["word_count"]),
                "excerpt": str(row["generation"])[:220],
            }
        )
    return results[:k]
