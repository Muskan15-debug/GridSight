import joblib
import pandas as pd

from pathlib import Path
from xgboost import XGBRegressor


class ModelTrainer:

    def __init__(self, config):
        self.config = config

    def initiate_model_training(self, train_path):

        print("\nStarting model training...")

        # ------------------------------------------------
        # Load training data
        # ------------------------------------------------

        train_df = pd.read_csv(train_path)

        print(
            f"Training dataset shape: {train_df.shape}"
        )

        # ------------------------------------------------
        # Separate features and target
        # ------------------------------------------------

        X_train = train_df.drop(
            columns=["Generation_kW"]
        )

        y_train = train_df[
            "Generation_kW"
        ]

        print(
            f"Number of features: {X_train.shape[1]}"
        )

        print(
            f"Training samples: {X_train.shape[0]}"
        )

        # ------------------------------------------------
        # Create XGBoost model
        # ------------------------------------------------

        print("\nInitializing XGBoost...")

        model = XGBRegressor(
            **self.config.model_params
        )

        # ------------------------------------------------
        # Train
        # ------------------------------------------------

        print("Training XGBoost model...")

        model.fit(
            X_train,
            y_train
        )

        print(
            "XGBoost training completed."
        )

        # ------------------------------------------------
        # Save model
        # ------------------------------------------------

        model_path = Path(
            self.config.trained_model_path
        )

        model_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        joblib.dump(
            model,
            model_path
        )

        print(
            f"Model saved to: {model_path}"
        )

        return model