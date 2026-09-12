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

        missing_columns = [
            col
            for col in self.REQUIRED_COLUMNS
            if col not in df.columns
        ]

        if missing_columns:

            self._write_status(
                f"FAILED: Missing columns: {missing_columns}"
            )

            return False

        self._write_status(
            "SUCCESS: All required columns are present."
        )

        return True

    def _write_status(self, message):

        self.config.status_file.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        with open(self.config.status_file, "w") as file:
            file.write(message)