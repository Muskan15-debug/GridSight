import pandas as pd
import numpy as np
from pathlib import Path


class DataTransformation:

    def __init__(self, config, physics_config):

        self.config = config
        self.physics = physics_config

    def initiate_data_transformation(self, df):

        print("\nStarting data transformation...")

        df = df.copy()

        # ============================================================
        # 1. Remove duplicate records
        # ============================================================

        initial_rows = len(df)

        df = df.drop_duplicates()

        print(
            f"Removed {initial_rows - len(df)} duplicate rows."
        )

        # ============================================================
        # 2. Create timestamp
        # ============================================================

        print("Creating timestamp...")

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

        # Remove invalid timestamps
        df = df.dropna(
            subset=["timestamp"]
        )

        df = df.sort_values(
            "timestamp"
        ).reset_index(drop=True)

        # ============================================================
        # 3. Physics-informed generation
        # ============================================================

        print("Generating physics-informed target...")

        noct = self.physics["noct"]
        gamma = self.physics["gamma"]
        capacity_kw = self.physics["capacity_kw"]
        system_loss = self.physics["system_loss"]

        # ------------------------------------------------------------
        # Cell temperature
        #
        # T_cell = T_ambient +
        #          ((NOCT - 20) / 800) * GHI
        # ------------------------------------------------------------

        df["T_cell"] = (
            df["Temperature"]
            + ((noct - 20) / 800)
            * df["GHI"]
        )

        # ------------------------------------------------------------
        # DC power
        #
        # P_dc = Capacity *
        #        (GHI / 1000) *
        #        (1 + gamma * (T_cell - 25))
        # ------------------------------------------------------------

        df["P_dc"] = (
            capacity_kw
            * (df["GHI"] / 1000)
            * (
                1
                + gamma
                * (df["T_cell"] - 25)
            )
        )

        # ------------------------------------------------------------
        # Final generation
        #
        # Generation = max(0, P_dc) * 0.97
        # ------------------------------------------------------------

        df["Generation_kW"] = (
            df["P_dc"].clip(lower=0)
            * system_loss
        )

        # ============================================================
        # 4. Feature engineering
        # ============================================================

        print("Creating time-based features...")

        df["hour"] = df["timestamp"].dt.hour

        df["day_of_year"] = (
            df["timestamp"].dt.dayofyear
        )

        df["month"] = (
            df["timestamp"].dt.month
        )

        df["day_of_week"] = (
            df["timestamp"].dt.dayofweek
        )

        # ============================================================
        # 5. Cyclic time features
        # ============================================================

        df["hour_sin"] = np.sin(
            2 * np.pi * df["hour"] / 24
        )

        df["hour_cos"] = np.cos(
            2 * np.pi * df["hour"] / 24
        )

        df["day_sin"] = np.sin(
            2 * np.pi * df["day_of_year"] / 365
        )

        df["day_cos"] = np.cos(
            2 * np.pi * df["day_of_year"] / 365
        )

        # ============================================================
        # 6. Select features
        # ============================================================

        features = [
            "GHI",
            "DNI",
            "DHI",
            "Temperature",
            "Wind Speed",
            "Relative Humidity",
            "Solar Zenith Angle",

            # Time features
            "hour",
            "day_of_year",
            "month",
            "day_of_week",

            # Cyclic features
            "hour_sin",
            "hour_cos",
            "day_sin",
            "day_cos",

            # Physics feature
            "T_cell",
        ]

        target = "Generation_kW"

        model_df = df[
            features + [target]
        ].copy()

        # ============================================================
        # 7. Remove missing values
        # ============================================================

        before_drop = len(model_df)

        model_df = model_df.dropna()

        print(
            f"Removed {before_drop - len(model_df)} "
            "rows containing missing values."
        )

        # ============================================================
        # 8. Chronological train/test split
        # ============================================================

        print("Creating chronological train/test split...")

        split_index = int(
            len(model_df) * 0.80
        )

        train_df = model_df.iloc[
            :split_index
        ].copy()

        test_df = model_df.iloc[
            split_index:
        ].copy()

        print(
            f"Training rows: {len(train_df)}"
        )

        print(
            f"Testing rows: {len(test_df)}"
        )

        # ============================================================
        # 9. Save processed datasets
        # ============================================================

        train_path = Path(
            self.config.transformed_train_path
        )

        test_path = Path(
            self.config.transformed_test_path
        )

        train_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        test_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        train_df.to_csv(
            train_path,
            index=False
        )

        test_df.to_csv(
            test_path,
            index=False
        )

        print(
            f"Training data saved to: {train_path}"
        )

        print(
            f"Testing data saved to: {test_path}"
        )

        print("\nData transformation completed successfully.")

        return train_df, test_df