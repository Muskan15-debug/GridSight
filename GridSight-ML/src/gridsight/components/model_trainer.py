import joblib
from xgboost import XGBRegressor


class ModelTrainer:

    def __init__(self, config):
        self.config = config

    def train(self, train_df):

        X_train = train_df.drop(
            columns=["Generation_kW"]
        )

        y_train = train_df[
            "Generation_kW"
        ]

        model = XGBRegressor(
            **self.config.model_params
        )

        model.fit(
            X_train,
            y_train
        )

        self.config.trained_model_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        joblib.dump(
            model,
            self.config.trained_model_path
        )

        print(
            f"Model saved to: "
            f"{self.config.trained_model_path}"
        )

        return model