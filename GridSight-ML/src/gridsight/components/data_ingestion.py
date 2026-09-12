import pandas as pd


class DataIngestion:

    def __init__(self, config):
        self.config = config

    def initiate_data_ingestion(self):

        print("Reading renewable energy dataset...")

        df = pd.read_csv(
            self.config.raw_data_path
        )

        print(f"Dataset shape: {df.shape}")

        return df