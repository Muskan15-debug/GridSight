from gridsight.config.configuration import ConfigurationManager

from gridsight.components.model_tuner import ModelTuner


def run():

    print("\n" + "=" * 60)
    print("STAGE 06: XGBOOST HYPERPARAMETER TUNING")
    print("=" * 60)

    # ------------------------------------------------
    # Configuration
    # ------------------------------------------------

    config = ConfigurationManager()

    tuning_config = (
        config.get_model_tuning_config()
    )

    transformation_config = (
        config.get_data_transformation_config()
    )

    # ------------------------------------------------
    # Hyperparameter tuning
    # ------------------------------------------------

    model_tuner = ModelTuner(
        config=tuning_config
    )

    model, best_params = (
        model_tuner
        .initiate_model_tuning(
            train_path=(
                transformation_config
                .transformed_train_path
            )
        )
    )

    return model, best_params


if __name__ == "__main__":
    run()