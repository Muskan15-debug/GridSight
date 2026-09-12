from gridsight.config.configuration import ConfigurationManager
from gridsight.components.data_ingestion import DataIngestion
from gridsight.components.data_validation import DataValidation


def run():

    print("\n" + "=" * 60)
    print("STAGE 02: DATA VALIDATION")
    print("=" * 60)

    # -----------------------------------------------
    # Configuration
    # -----------------------------------------------

    config = ConfigurationManager()

    ingestion_config = (
        config.get_data_ingestion_config()
    )

    validation_config = (
        config.get_data_validation_config()
    )

    # -----------------------------------------------
    # Data Ingestion
    # -----------------------------------------------

    data_ingestion = DataIngestion(
        config=ingestion_config
    )

    df = data_ingestion.initiate_data_ingestion()

    # -----------------------------------------------
    # Data Validation
    # -----------------------------------------------

    data_validation = DataValidation(
        config=validation_config
    )

    validation_status = (
        data_validation.validate(df)
    )

    if not validation_status:

        raise Exception(
            "Data validation failed. "
            "Check the validation report."
        )

    return True


if __name__ == "__main__":
    run()