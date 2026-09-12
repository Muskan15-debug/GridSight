from dataclasses import dataclass
from pathlib import Path


@dataclass
class DataIngestionConfig:
    raw_data_path: Path


@dataclass
class DataValidationConfig:
    status_file: Path


@dataclass
class DataTransformationConfig:
    transformed_train_path: Path
    transformed_test_path: Path


@dataclass
class ModelTrainerConfig:
    trained_model_path: Path
    model_params: dict


@dataclass
class ModelEvaluationConfig:
    evaluation_file_path: Path
    

@dataclass
class ModelTuningConfig:

    n_trials: int

    tuned_model_path: str

    best_params_path: str

    study_path: str


@dataclass
class TunedModelEvaluationConfig:

    tuned_metrics_path: str