import hashlib
import json
from pathlib import Path
from typing import Any, Dict, Optional


CACHE_DIR = Path(__file__).resolve().parents[1] / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


def params_hash(params: Dict[str, Any]) -> str:
    stable = json.dumps(params, sort_keys=True, default=str)
    return hashlib.sha256(stable.encode("utf-8")).hexdigest()[:16]


def cache_path(kind: str, params: Dict[str, Any]) -> Path:
    return CACHE_DIR / f"{kind}_{params_hash(params)}.json"


def load_json_cache(kind: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    path = cache_path(kind, params)
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def save_json_cache(kind: str, params: Dict[str, Any], payload: Dict[str, Any]) -> None:
    path = cache_path(kind, params)
    tmp_path = path.with_suffix(".tmp")
    tmp_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    tmp_path.replace(path)
