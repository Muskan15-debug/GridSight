import json
import joblib
import numpy as np
import pandas as pd

from pathlib import Path

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)


class TunedModelEvaluation:

    def __init__(self, config):
        self.config = config

    def initiate_evaluation(
        self,
        model_path,
        test_path
    ):

        print("\nStarting tuned model evaluation...")

        # ============================================================
        # 1. Load tuned model
        # ============================================================

        print("Loading tuned XGBoost model...")

        model = joblib.load(model_path)

        # ============================================================
        # 2. Load untouched test data
        # ============================================================

        print("Loading test dataset...")

        test_df = pd.read_csv(test_path)

        print(
            f"Test dataset shape: {test_df.shape}"
        )

        # ============================================================
        # 3. Separate features and target
        # ============================================================

        X_test = test_df.drop(
            columns=["Generation_kW"]
        )

        y_test = test_df[
            "Generation_kW"
        ]

        # ============================================================
        # 4. Predictions
        # ============================================================

        print("Generating tuned model predictions...")

        predictions = model.predict(
            X_test
        )

        # ============================================================
        # 5. Metrics
        # ============================================================

        mae = mean_absolute_error(
            y_test,
            predictions
        )

        rmse = np.sqrt(
            mean_squared_error(
                y_test,
                predictions
            )
        )

        r2 = r2_score(
            y_test,
            predictions
        )

        # Safe MAPE
        non_zero_mask = y_test != 0

        if non_zero_mask.sum() > 0:

            mape = np.mean(
                np.abs(
                    (
                        y_test[non_zero_mask]
                        - predictions[non_zero_mask]
                    )
                    / y_test[non_zero_mask]
                )
            ) * 100

        else:

            mape = None

        # ============================================================
        # 6. Print results
        # ============================================================

        print("\n" + "=" * 60)
        print("TUNED XGBOOST EVALUATION RESULTS")
        print("=" * 60)

        print(
            f"MAE  : {mae:.4f} kW"
        )

        print(
            f"RMSE : {rmse:.4f} kW"
        )

        print(
            f"R²   : {r2:.4f}"
        )

        if mape is not None:

            print(
                f"MAPE : {mape:.2f}%"
            )

        print("=" * 60)

        # ============================================================
        # 7. Save metrics
        # ============================================================

        metrics = {
            "MAE": float(mae),
            "RMSE": float(rmse),
            "R2": float(r2)
        }

        if mape is not None:
            metrics["MAPE"] = float(mape)

        metrics_path = Path(
            self.config.tuned_metrics_path
        )

        metrics_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        with open(
            metrics_path,
            "w"
        ) as file:

            json.dump(
                metrics,
                file,
                indent=4
            )

        print(
            f"\nMetrics saved to: {metrics_path}"
        )

        # ============================================================
        # 8. Save predictions
        # ============================================================

        prediction_df = pd.DataFrame({

            "Actual_Generation_kW":
                y_test.values,

            "Tuned_Predicted_Generation_kW":
                predictions
        })

        prediction_path = (
            metrics_path.parent
            / "predictions.csv"
        )

        prediction_df.to_csv(
            prediction_path,
            index=False
        )

        print(
            f"Predictions saved to: {prediction_path}"
        )

        return metrics