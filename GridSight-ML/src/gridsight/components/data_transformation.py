import pandas as pd
import numpy as np


class DataTransformation:

    def __init__(self, config, physics_config):

        self.config = config
        self.physics = physics_config

    def initiate_data_transformation(self, df):

        df = df.copy()

        # ------------------------------------------------
        # 1. Replace NSRDB missing value codes
        # ------------------------------------------------

        df = df.replace(
            [-9999, -9999.0],
            np.nan
        )

        # ------------------------------------------------
        # 2. Create timestamp
        # ------------------------------------------------

        df["timestamp"] = pd.to_datetime(
            df[
                [
                    "Year",
                    "Month",
                    "Day",
                    "Hour",
                    "Minute"
                ]
            ],
            errors="coerce"
        )

        df = df.sort_values(
            "timestamp"
        ).reset_index(drop=True)

        # ------------------------------------------------
        # 3. Physics-based target
        # ------------------------------------------------

        noct = self.physics["noct"]
        gamma = self.physics["gamma"]
        capacity = self.physics["capacity_kw"]
        system_loss = self.physics["system_loss"]

        # Cell temperature
        df["T_cell"] = (
            df["Temperature"]
            + ((noct - 20) / 800)
            * df["GHI"]
        )

        # DC power
        df["P_dc"] = (
            capacity
            * (df["GHI"] / 1000)
            * (
                1
                + gamma
                * (df["T_cell"] - 25)
            )
        )

        # Final generation
        df["Generation_kW"] = (
            df["P_dc"].clip(lower=0)
            * system_loss
        )

        # ------------------------------------------------
        # 4. Temporal features
        # ------------------------------------------------

        df["hour"] = df["timestamp"].dt.hour
        df["day_of_year"] = (
            df["timestamp"].dt.dayofyear
        )
        df["month"] = (
            df["timestamp"].dt.month
        )

        # ------------------------------------------------
        # 5. Select ML features
        # ------------------------------------------------

        features = [
            "GHI",
            "DNI",
            "DHI",
            "Temperature",
            "Wind Speed",
            "Relative Humidity",
            "Solar Zenith Angle",
            "hour",
            "day_of_year",
            "month",
        ]

        target = "Generation_kW"

        model_df = df[
            features + [target]
        ].dropna()

        # ------------------------------------------------
        # 6. Chronological split
        # ------------------------------------------------

        split_index = int(
            len(model_df) * 0.8
        )

        train_df = model_df.iloc[
            :split_index
        ]

        test_df = model_df.iloc[
            split_index:
        ]

        train_df.to_csv(
            self.config.transformed_train_path,
            index=False
        )

        test_df.to_csv(
            self.config.transformed_test_path,
            index=False
        )

        return train_df, test_df