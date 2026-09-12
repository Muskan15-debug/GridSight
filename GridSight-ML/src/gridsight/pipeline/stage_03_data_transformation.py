from gridsight.config.configuration import ConfigurationManager

from gridsight.components.data_ingestion import DataIngestion
from gridsight.components.data_transformation import DataTransformation


def run():

    print("\n" + "=" * 60)
    print("STAGE 03: DATA TRANSFORMATION")
    print("=" * 60)

    # ------------------------------------------------
    # Configuration
    # ------------------------------------------------

    config = ConfigurationManager()

    ingestion_config = (
        config.get_data_ingestion_config()
    )

    transformation_config = (
        config.get_data_transformation_config()
    )

    # ------------------------------------------------
    # Data ingestion
    # ------------------------------------------------

    data_ingestion = DataIngestion(
        config=ingestion_config
    )

    df = data_ingestion.initiate_data_ingestion()

    # ------------------------------------------------
    # Physics configuration
    # ------------------------------------------------

    physics_config = config.config["physics"]

    # ------------------------------------------------
    # Transformation
    # ------------------------------------------------

    data_transformation = DataTransformation(
        config=transformation_config,
        physics_config=physics_config
    )

    train_df, test_df = (
        data_transformation
        .initiate_data_transformation(df)
    )

    return train_df, test_df


if __name__ == "__main__":
    run()