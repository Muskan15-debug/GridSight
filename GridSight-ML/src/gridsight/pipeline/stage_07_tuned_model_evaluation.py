from gridsight.config.configuration import ConfigurationManager

from gridsight.components.tuned_model_evaluation import (
    TunedModelEvaluation
)


def run():

    print("\n" + "=" * 60)
    print("STAGE 07: TUNED MODEL EVALUATION")
    print("=" * 60)

    # ------------------------------------------------
    # Configuration
    # ------------------------------------------------

    config = ConfigurationManager()

    evaluation_config = (
        config.get_tuned_model_evaluation_config()
    )

    tuning_config = (
        config.get_model_tuning_config()
    )

    transformation_config = (
        config.get_data_transformation_config()
    )

    # ------------------------------------------------
    # Evaluation
    # ------------------------------------------------

    evaluator = TunedModelEvaluation(
        config=evaluation_config
    )

    metrics = evaluator.initiate_evaluation(

        model_path=(
            tuning_config.tuned_model_path
        ),

        test_path=(
            transformation_config
            .transformed_test_path
        )
    )

    return metrics


if __name__ == "__main__":
    run()