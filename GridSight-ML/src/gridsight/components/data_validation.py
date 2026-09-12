from pathlib import Path


class DataValidation:

    REQUIRED_COLUMNS = [
        "Year",
        "Month",
        "Day",
        "Hour",
        "Minute",
        "Temperature",
        "DHI",
        "DNI",
        "GHI",
        "Relative Humidity",
        "Solar Zenith Angle",
        "Wind Speed",
    ]

    def __init__(self, config):
        self.config = config

    def validate(self, df):

        print("\nStarting data validation...")

        validation_results = []

        # ------------------------------------------------
        # 1. Check required columns
        # ------------------------------------------------

        missing_columns = [
            column
            for column in self.REQUIRED_COLUMNS
            if column not in df.columns
        ]

        if missing_columns:

            validation_results.append(
                f"FAILED: Missing columns: {missing_columns}"
            )

        else:

            validation_results.append(
                "PASSED: All required columns are present."
            )

        # ------------------------------------------------
        # 2. Check dataset is not empty
        # ------------------------------------------------

        if df.empty:

            validation_results.append(
                "FAILED: Dataset is empty."
            )

        else:

            validation_results.append(
                f"PASSED: Dataset contains {len(df)} rows."
            )

        # ------------------------------------------------
        # 3. Check duplicate rows
        # ------------------------------------------------

        duplicate_count = df.duplicated().sum()

        if duplicate_count > 0:

            validation_results.append(
                f"WARNING: {duplicate_count} duplicate rows found."
            )

        else:

            validation_results.append(
                "PASSED: No duplicate rows found."
            )

        # ------------------------------------------------
        # 4. Check missing values
        # ------------------------------------------------

        missing_values = df[
            self.REQUIRED_COLUMNS
        ].isnull().sum()

        total_missing = missing_values.sum()

        if total_missing > 0:

            validation_results.append(
                f"WARNING: {total_missing} missing values found."
            )

        else:

            validation_results.append(
                "PASSED: No missing values found."
            )

        # ------------------------------------------------
        # 5. Check numerical ranges
        # ------------------------------------------------

        if "GHI" in df.columns:

            invalid_ghi = (
                df["GHI"] < 0
            ).sum()

            if invalid_ghi > 0:

                validation_results.append(
                    f"WARNING: {invalid_ghi} negative GHI values found."
                )

            else:

                validation_results.append(
                    "PASSED: GHI values are valid."
                )

        if "DNI" in df.columns:

            invalid_dni = (
                df["DNI"] < 0
            ).sum()

            if invalid_dni > 0:

                validation_results.append(
                    f"WARNING: {invalid_dni} negative DNI values found."
                )

            else:

                validation_results.append(
                    "PASSED: DNI values are valid."
                )

        if "DHI" in df.columns:

            invalid_dhi = (
                df["DHI"] < 0
            ).sum()

            if invalid_dhi > 0:

                validation_results.append(
                    f"WARNING: {invalid_dhi} negative DHI values found."
                )

            else:

                validation_results.append(
                    "PASSED: DHI values are valid."
                )

        # ------------------------------------------------
        # 6. Save validation status
        # ------------------------------------------------

        self._save_validation_status(
            validation_results
        )

        # ------------------------------------------------
        # 7. Print results
        # ------------------------------------------------

        print("\nData Validation Results:")
        print("-" * 60)

        for result in validation_results:
            print(result)

        print("-" * 60)

        # Required-column failure is a hard failure
        if missing_columns or df.empty:

            print("\n❌ DATA VALIDATION FAILED")

            return False

        print("\n✅ DATA VALIDATION PASSED")

        return True

    def _save_validation_status(
        self,
        validation_results
    ):

        status_path = Path(
            self.config.status_file
        )

        status_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        with open(
            status_path,
            "w"
        ) as file:

            for result in validation_results:
                file.write(
                    result + "\n"
                )