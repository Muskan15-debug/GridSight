from gridsight.config.configuration import ConfigurationManager

from gridsight.components.model_trainer import ModelTrainer


def run():

    print("\n" + "=" * 60)
    print("STAGE 04: MODEL TRAINING")
    print("=" * 60)

    # ------------------------------------------------
    # Configuration
    # ------------------------------------------------

    config = ConfigurationManager()

    model_trainer_config = (
        config.get_model_trainer_config()
    )

    transformation_config = (
        config.get_data_transformation_config()
    )

    # ------------------------------------------------
    # Model training
    # ------------------------------------------------

    model_trainer = ModelTrainer(
        config=model_trainer_config
    )

    model = model_trainer.initiate_model_training(
        train_path=(
            transformation_config
            .transformed_train_path
        )
    )

    return model


if __name__ == "__main__":
    run()