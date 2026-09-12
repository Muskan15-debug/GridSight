from setuptools import find_packages, setup


setup(
    name="gridsight",
    version="0.0.1",
    author="GridSight Team",
    packages=find_packages("src"),
    package_dir={"": "src"},
)