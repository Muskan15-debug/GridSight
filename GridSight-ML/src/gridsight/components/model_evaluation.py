import json
import numpy as np

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)


class ModelEvaluation:

    def __init__(self, config):
        self.config = config

    def evaluate(self, model, test_df):

        X_test = test_df.drop(
            columns=["Generation_kW"]
        )

        y_test = test_df[
            "Generation_kW"
        ]

        predictions = model.predict(
            X_test
        )

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

        metrics = {
            "MAE": float(mae),
            "RMSE": float(rmse),
            "R2": float(r2)
        }

        self.config.evaluation_file_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        with open(
            self.config.evaluation_file_path,
            "w"
        ) as file:

            json.dump(
                metrics,
                file,
                indent=4
            )

        print(metrics)

        return metrics