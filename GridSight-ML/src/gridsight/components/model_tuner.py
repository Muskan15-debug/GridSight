import json
import joblib
import optuna
import pandas as pd

from pathlib import Path
from xgboost import XGBRegressor
from sklearn.metrics import mean_squared_error


class ModelTuner:

    def __init__(self, config):
        self.config = config

    def initiate_model_tuning(self, train_path):

        print("\nStarting XGBoost hyperparameter tuning...")

        # ============================================================
        # 1. Load training data
        # ============================================================

        df = pd.read_csv(train_path)

        X = df.drop(columns=["Generation_kW"])
        y = df["Generation_kW"]

        # ============================================================
        # 2. Chronological train / validation split
        # ============================================================

        split_index = int(len(df) * 0.80)

        X_train = X.iloc[:split_index]
        y_train = y.iloc[:split_index]

        X_valid = X.iloc[split_index:]
        y_valid = y.iloc[split_index:]

        print(f"Training samples   : {len(X_train)}")
        print(f"Validation samples : {len(X_valid)}")

        # ============================================================
        # 3. Optuna objective
        # ============================================================

        def objective(trial):

            params = {
                "n_estimators": trial.suggest_int(
                    "n_estimators", 200, 1000
                ),

                "max_depth": trial.suggest_int(
                    "max_depth", 3, 12
                ),

                "learning_rate": trial.suggest_float(
                    "learning_rate", 0.01, 0.2, log=True
                ),

                "subsample": trial.suggest_float(
                    "subsample", 0.6, 1.0
                ),

                "colsample_bytree": trial.suggest_float(
                    "colsample_bytree", 0.6, 1.0
                ),

                "min_child_weight": trial.suggest_int(
                    "min_child_weight", 1, 10
                ),

                "gamma": trial.suggest_float(
                    "gamma", 0.0, 5.0
                ),

                "reg_alpha": trial.suggest_float(
                    "reg_alpha", 1e-8, 10.0, log=True
                ),

                "reg_lambda": trial.suggest_float(
                    "reg_lambda", 1e-3, 10.0, log=True
                ),

                "objective": "reg:squarederror",

                "eval_metric": "rmse",

                "random_state": 42,

                "n_jobs": -1,
            }

            model = XGBRegressor(
                **params
            )

            model.fit(
                X_train,
                y_train,
                eval_set=[
                    (X_valid, y_valid)
                ],
                verbose=False
            )

            predictions = model.predict(
                X_valid
            )

            rmse = mean_squared_error(
                y_valid,
                predictions
            ) ** 0.5

            return rmse

        # ============================================================
        # 4. Create Optuna study
        # ============================================================

        study = optuna.create_study(
            direction="minimize"
        )

        n_trials = self.config.n_trials

        print(
            f"\nRunning {n_trials} Optuna trials..."
        )

        study.optimize(
            objective,
            n_trials=n_trials
        )

        # ============================================================
        # 5. Best parameters
        # ============================================================

        best_params = study.best_params

        print("\n" + "=" * 60)
        print("BEST XGBOOST PARAMETERS")
        print("=" * 60)

        for parameter, value in best_params.items():

            print(
                f"{parameter}: {value}"
            )

        print("=" * 60)

        print(
            f"\nBest validation RMSE: "
            f"{study.best_value:.4f} kW"
        )

        # ============================================================
        # 6. Train final tuned model
        # ============================================================

        print(
            "\nTraining final tuned XGBoost model..."
        )

        best_params.update({

            "objective":
                "reg:squarederror",

            "eval_metric":
                "rmse",

            "random_state":
                42,

            "n_jobs":
                -1
        })

        final_model = XGBRegressor(
            **best_params
        )

        final_model.fit(
            X,
            y,
            verbose=False
        )

        # ============================================================
        # 7. Save model
        # ============================================================

        model_path = Path(
            self.config.tuned_model_path
        )

        model_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        joblib.dump(
            final_model,
            model_path
        )

        print(
            f"\nTuned model saved to: {model_path}"
        )

        # ============================================================
        # 8. Save best parameters
        # ============================================================

        params_path = Path(
            self.config.best_params_path
        )

        params_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        with open(
            params_path,
            "w"
        ) as file:

            json.dump(
                best_params,
                file,
                indent=4
            )

        print(
            f"Best parameters saved to: {params_path}"
        )

        # ============================================================
        # 9. Save Optuna study
        # ============================================================

        study_path = Path(
            self.config.study_path
        )

        study_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        study.trials_dataframe().to_csv(
            study_path,
            index=False
        )

        print(
            f"Optuna study saved to: {study_path}"
        )

        print(
            "\nHyperparameter tuning completed successfully."
        )

        return final_model, best_params