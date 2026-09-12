from gridsight.config.configuration import ConfigurationManager
from gridsight.components.data_ingestion import DataIngestion


def run():

    config = ConfigurationManager()

    ingestion_config = (
        config.get_data_ingestion_config()
    )

    ingestion = DataIngestion(
        ingestion_config
    )

    return ingestion.initiate_data_ingestion()


if __name__ == "__main__":
    run()