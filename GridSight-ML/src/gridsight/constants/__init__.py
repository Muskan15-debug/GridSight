from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[3]

CONFIG_FILE_PATH = PROJECT_ROOT / "config" / "config.yaml"

DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"

ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"

LOG_DIR = PROJECT_ROOT / "logs"