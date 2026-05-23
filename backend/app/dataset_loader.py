from functools import lru_cache
import math
from typing import Dict, List, Tuple

import pandas as pd
from datasets import load_dataset


DATASET_NAME = "liamdugan/raid"
DATASET_CONFIG = "raid"
USEFUL_COLUMNS = [
    "generation",
    "model",
    "domain",
    "attack",
    "decoding",
    "repetition_penalty",
    "title",
    "prompt",
]


def _normalize_value(value, fallback: str = "unknown") -> str:
    if value is None:
        return fallback
    text = str(value).strip()
    return text if text else fallback


@lru_cache(maxsize=1)
def get_dataset():
    return load_dataset(DATASET_NAME, DATASET_CONFIG)


def _pick_split(ds) -> str:
    for split in ("train", "test", "validation"):
        if split in ds:
            return split
    return list(ds.keys())[0]


def _available_columns(ds) -> List[str]:
    split = _pick_split(ds)
    return list(ds[split].column_names)


def load_metadata(sample_size: int = 25000, seed: int = 42) -> Dict[str, List[str]]:
    ds = get_dataset()
    split = _pick_split(ds)
    columns = _available_columns(ds)
    wanted = [c for c in ["model", "domain", "attack", "decoding"] if c in columns]
    if not wanted:
        return {"models": [], "domains": [], "attacks": [], "decoding": []}

    n = min(sample_size, len(ds[split]))
    sample = ds[split].shuffle(seed=seed).select(range(n))
    df = sample.to_pandas()[wanted]
    return {
        "models": sorted(df["model"].dropna().astype(str).unique().tolist()) if "model" in df else [],
        "domains": sorted(df["domain"].dropna().astype(str).unique().tolist()) if "domain" in df else [],
        "attacks": sorted(df["attack"].dropna().astype(str).unique().tolist()) if "attack" in df else [],
        "decoding": sorted(df["decoding"].dropna().astype(str).unique().tolist()) if "decoding" in df else [],
    }


def _balanced_subset(df: pd.DataFrame, requested_models: List[str], requested_domains: List[str]) -> Tuple[pd.DataFrame, List[str]]:
    warnings = []
    if "model" not in df.columns:
        df["model"] = "unknown"
    if "domain" not in df.columns:
        df["domain"] = "unknown"

    if requested_models:
        df = df[df["model"].astype(str).isin(requested_models)]
    else:
        counts = df["model"].astype(str).value_counts()
        ai_models = [m for m in counts.index.tolist() if m != "human"][:4]
        selected = (["human"] if "human" in counts.index else []) + ai_models
        if selected:
            df = df[df["model"].astype(str).isin(selected)]
            warnings.append(f"Auto-selected models: {', '.join(selected)}")

    if requested_domains:
        df = df[df["domain"].astype(str).isin(requested_domains)]
    else:
        selected_domains = df["domain"].astype(str).value_counts().index.tolist()[:4]
        if selected_domains:
            df = df[df["domain"].astype(str).isin(selected_domains)]
            warnings.append(f"Auto-selected domains: {', '.join(selected_domains)}")

    return df, warnings


def _sample_with_human_floor(df: pd.DataFrame, max_rows: int, seed: int) -> Tuple[pd.DataFrame, str]:
    human_df = df[df["label"] == "human"]
    ai_df = df[df["label"] == "AI"]

    if ai_df.empty:
        human_target = min(len(human_df), max(max_rows, 100))
        sampled = human_df.sample(n=human_target, random_state=seed) if len(human_df) > human_target else human_df
        return sampled, f"Balanced sampling applied: {len(sampled)} human and 0 AI samples."

    if human_df.empty:
        ai_target = min(len(ai_df), max_rows)
        sampled = ai_df.sample(n=ai_target, random_state=seed) if len(ai_df) > ai_target else ai_df
        return sampled, "Balanced sampling could not include human samples because none matched the active filters."

    ai_target = min(len(ai_df), math.floor(max_rows * 2 / 3))
    ai_target = min(ai_target, len(human_df) * 2)
    human_target = min(len(human_df), max_rows - ai_target)
    required_human = math.ceil(ai_target * 0.5)

    if human_target < required_human:
        ai_target = min(ai_target, human_target * 2)
        required_human = math.ceil(ai_target * 0.5)
    human_target = min(len(human_df), max(required_human, human_target))

    sampled_ai = ai_df.sample(n=ai_target, random_state=seed) if len(ai_df) > ai_target else ai_df
    sampled_human = (
        human_df.sample(n=human_target, random_state=seed + 1)
        if len(human_df) > human_target
        else human_df
    )
    sampled = pd.concat([sampled_human, sampled_ai], ignore_index=True)
    if len(sampled) > max_rows:
        sampled = sampled.sample(n=max_rows, random_state=seed)
    sampled = sampled.sample(frac=1, random_state=seed).reset_index(drop=True)
    return sampled, f"Balanced sampling applied: {len(sampled_human)} human and {len(sampled_ai)} AI samples."


def load_filtered_rows(
    max_rows: int,
    models: List[str],
    domains: List[str],
    attacks: List[str],
    seed: int,
) -> Tuple[pd.DataFrame, List[str]]:
    ds = get_dataset()
    split = _pick_split(ds)
    columns = _available_columns(ds)
    read_columns = [c for c in USEFUL_COLUMNS if c in columns]
    if "generation" not in read_columns:
        raise ValueError("Dataset does not include a generation column.")

    # Read a bounded random pool, then filter/sample in pandas to keep browser payloads small.
    pool_size = min(max(max_rows * 8, 20000), len(ds[split]))
    sample = ds[split].shuffle(seed=seed).select(range(pool_size))
    df = sample.to_pandas()[read_columns].copy()

    for column in USEFUL_COLUMNS:
        if column not in df.columns:
            df[column] = "" if column in {"generation", "title", "prompt"} else "unknown"

    df["model"] = df["model"].map(lambda x: _normalize_value(x, "unknown"))
    df["domain"] = df["domain"].map(lambda x: _normalize_value(x, "unknown"))
    df["attack"] = df["attack"].map(lambda x: _normalize_value(x, "none"))
    df["decoding"] = df["decoding"].map(lambda x: _normalize_value(x, "unknown"))
    df["label"] = df["model"].apply(lambda m: "human" if m == "human" else "AI")

    if attacks:
        df = df[df["attack"].astype(str).isin(attacks)]

    df, warnings = _balanced_subset(df, models, domains)
    if df.empty:
        raise ValueError("No rows matched the selected filters. Try broader model, domain, or attack settings.")

    df, sampling_warning = _sample_with_human_floor(df, max_rows, seed)
    warnings.append(sampling_warning)
    df = df.reset_index(drop=True)
    df["sample_id"] = [f"s{seed}_{i}" for i in range(len(df))]
    return df, warnings
