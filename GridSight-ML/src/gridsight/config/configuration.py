from pathlib import Path
import yaml

from gridsight.entity.config_entity import (
    DataIngestionConfig,
    DataValidationConfig,
    DataTransformationConfig,
    ModelTrainerConfig,
    ModelEvaluationConfig,
)


class ConfigurationManager:

    def __init__(self, config_file_path="config/config.yaml"):

        with open(config_file_path, "r") as file:
            self.config = yaml.safe_load(file)

    def get_data_ingestion_config(self):

        return DataIngestionConfig(
            raw_data_path=Path("data/raw")
            / self.config["data"]["raw_file"]
        )

    def get_data_validation_config(self):

        return DataValidationConfig(
            status_file=Path(
                "artifacts/data_validation/status.txt"
            )
        )

    def get_data_transformation_config(self):

        return DataTransformationConfig(
            transformed_train_path=Path(
                "data/processed/train.csv"
            ),

            transformed_test_path=Path(
                "data/processed/test.csv"
            )
        )

    def get_model_trainer_config(self):

        return ModelTrainerConfig(
            trained_model_path=Path(
                "artifacts/model_training/xgboost_model.pkl"
            ),

            model_params=self.config["model"]
        )

    def get_model_evaluation_config(self):

        return ModelEvaluationConfig(
            evaluation_file_path=Path(
                "artifacts/model_evaluation/metrics.json"
            )
        )