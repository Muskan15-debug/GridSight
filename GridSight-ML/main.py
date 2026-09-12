from gridsight.pipeline.stage_01_data_ingestion import run as ingestion
from gridsight.pipeline.stage_02_data_validation import run as validation
from gridsight.pipeline.stage_03_data_transformation import run as transformation
from gridsight.pipeline.stage_04_model_training import run as training
from gridsight.pipeline.stage_05_model_evaluation import run as evaluation


if __name__ == "__main__":

    print("=" * 60)
    print("GRIDSiGHT ML PIPELINE")
    print("=" * 60)

    ingestion()

    validation()

    transformation()

    training()

    evaluation()

    print("\nPipeline completed successfully.")