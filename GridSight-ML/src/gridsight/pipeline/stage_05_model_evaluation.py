from gridsight.config.configuration import ConfigurationManager

from gridsight.components.model_evaluation import (
    ModelEvaluation
)


def run():

    print("\n" + "=" * 60)
    print("STAGE 05: MODEL EVALUATION")
    print("=" * 60)

    # ------------------------------------------------
    # Configuration
    # ------------------------------------------------

    config = ConfigurationManager()

    evaluation_config = (
        config.get_model_evaluation_config()
    )

    model_trainer_config = (
        config.get_model_trainer_config()
    )

    transformation_config = (
        config.get_data_transformation_config()
    )

    # ------------------------------------------------
    # Evaluation
    # ------------------------------------------------

    model_evaluation = ModelEvaluation(
        config=evaluation_config
    )

    metrics = (
        model_evaluation
        .initiate_model_evaluation(
            model_path=(
                model_trainer_config
                .trained_model_path
            ),

            test_path=(
                transformation_config
                .transformed_test_path
            )
        )
    )

    return metrics


if __name__ == "__main__":
    run()