import pandas as pd
from pathlib import Path


class DataIngestion:

    def __init__(self, config):

        self.config = config

    def initiate_data_ingestion(self):

        print("\nStarting data ingestion...")

        raw_data_path = Path(
            self.config.raw_data_path
        )

        if not raw_data_path.exists():

            raise FileNotFoundError(
                f"Dataset not found at: {raw_data_path}"
            )

        print(
            f"Reading dataset from: "
            f"{raw_data_path}"
        )

        df = pd.read_csv(
            raw_data_path
        )

        print(
            f"Dataset loaded successfully."
        )

        print(
            f"Rows: {df.shape[0]}"
        )

        print(
            f"Columns: {df.shape[1]}"
        )

        return df