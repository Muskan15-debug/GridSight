from gridsight.config.configuration import ConfigurationManager
from gridsight.components.data_ingestion import DataIngestion


def run():

    print("\n" + "=" * 60)
    print("STAGE 01: DATA INGESTION")
    print("=" * 60)

    config = ConfigurationManager()

    data_ingestion_config = (
        config.get_data_ingestion_config()
    )

    data_ingestion = DataIngestion(
        config=data_ingestion_config
    )

    df = data_ingestion.initiate_data_ingestion()

    return df


if __name__ == "__main__":
    run()