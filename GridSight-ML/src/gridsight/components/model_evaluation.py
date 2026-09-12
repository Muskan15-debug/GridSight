import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from pathlib import Path

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)


class ModelEvaluation:

    def __init__(self, config):
        self.config = config

    def initiate_model_evaluation(
        self,
        model_path,
        test_path
    ):

        print("\nStarting model evaluation...")

        # ============================================================
        # 1. Load model
        # ============================================================

        print("Loading trained model...")

        model = joblib.load(model_path)

        # ============================================================
        # 2. Load test data
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
        # 4. Generate predictions
        # ============================================================

        print("Generating predictions...")

        predictions = model.predict(
            X_test
        )

        # ============================================================
        # 5. Calculate metrics
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

        # ============================================================
        # 6. Calculate MAPE safely
        # ============================================================

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
        # 7. Print metrics
        # ============================================================

        print("\n" + "=" * 60)
        print("MODEL EVALUATION RESULTS")
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
        # 8. Save metrics
        # ============================================================

        metrics = {
            "MAE": float(mae),
            "RMSE": float(rmse),
            "R2": float(r2),
        }

        if mape is not None:
            metrics["MAPE"] = float(mape)

        metrics_path = Path(
            self.config.evaluation_file_path
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
        # 9. Save predictions
        # ============================================================

        prediction_df = pd.DataFrame({

            "Actual_Generation_kW":
                y_test.values,

            "Predicted_Generation_kW":
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

        # ============================================================
        # 10. Actual vs Predicted plot
        # ============================================================

        self._plot_actual_vs_predicted(
            y_test,
            predictions,
            metrics_path.parent
        )

        # ============================================================
        # 11. Residual plot
        # ============================================================

        self._plot_residuals(
            y_test,
            predictions,
            metrics_path.parent
        )

        # ============================================================
        # 12. Feature importance
        # ============================================================

        self._plot_feature_importance(
            model,
            X_test,
            metrics_path.parent
        )

        return metrics

    # ================================================================
    # Actual vs Predicted
    # ================================================================

    def _plot_actual_vs_predicted(
        self,
        actual,
        predicted,
        output_dir
    ):

        plt.figure(
            figsize=(8, 6)
        )

        plt.scatter(
            actual,
            predicted,
            alpha=0.3
        )

        min_value = min(
            actual.min(),
            predicted.min()
        )

        max_value = max(
            actual.max(),
            predicted.max()
        )

        plt.plot(
            [min_value, max_value],
            [min_value, max_value],
            linestyle="--"
        )

        plt.xlabel(
            "Actual Generation (kW)"
        )

        plt.ylabel(
            "Predicted Generation (kW)"
        )

        plt.title(
            "Actual vs Predicted Solar Generation"
        )

        plt.tight_layout()

        path = (
            Path(output_dir)
            / "actual_vs_predicted.png"
        )

        plt.savefig(path)

        plt.close()

        print(
            f"Actual vs predicted plot saved to: {path}"
        )

    # ================================================================
    # Residual analysis
    # ================================================================

    def _plot_residuals(
        self,
        actual,
        predicted,
        output_dir
    ):

        residuals = (
            actual - predicted
        )

        plt.figure(
            figsize=(8, 6)
        )

        plt.scatter(
            predicted,
            residuals,
            alpha=0.3
        )

        plt.axhline(
            y=0,
            linestyle="--"
        )

        plt.xlabel(
            "Predicted Generation (kW)"
        )

        plt.ylabel(
            "Residual (kW)"
        )

        plt.title(
            "Residual Analysis"
        )

        plt.tight_layout()

        path = (
            Path(output_dir)
            / "residuals.png"
        )

        plt.savefig(path)

        plt.close()

        print(
            f"Residual plot saved to: {path}"
        )

    # ================================================================
    # Feature importance
    # ================================================================

    def _plot_feature_importance(
        self,
        model,
        X_test,
        output_dir
    ):

        importance = model.feature_importances_

        importance_df = pd.DataFrame({

            "feature":
                X_test.columns,

            "importance":
                importance
        })

        importance_df = (
            importance_df
            .sort_values(
                "importance",
                ascending=False
            )
        )

        # Save importance values
        importance_df.to_csv(
            Path(output_dir)
            / "feature_importance.csv",
            index=False
        )

        # Plot top features
        top_features = (
            importance_df
            .head(15)
            .sort_values(
                "importance"
            )
        )

        plt.figure(
            figsize=(9, 7)
        )

        plt.barh(
            top_features["feature"],
            top_features["importance"]
        )

        plt.xlabel(
            "Importance"
        )

        plt.ylabel(
            "Feature"
        )

        plt.title(
            "XGBoost Feature Importance"
        )

        plt.tight_layout()

        path = (
            Path(output_dir)
            / "feature_importance.png"
        )

        plt.savefig(path)

        plt.close()

        print(
            f"Feature importance saved to: {path}"
        )