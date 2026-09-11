from pathlib import Path
import geopandas as gpd


# Get the project root directory.
# This file is located at: project_root/ml/data/inspect_data.py
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Path where the raw GeoJSON files are stored.
RAW_DATA_DIR = PROJECT_ROOT / "data" / "raw"


DATASETS = [
    "chamoli_habitations.geojson",
    "chamoli_zones.geojson",
    "chamoli_sites.geojson",
]


def inspect_dataset(filename: str) -> None:
    """Load and print useful information about one GeoJSON dataset."""

    file_path = RAW_DATA_DIR / filename

    print("\n" + "=" * 70)
    print(f"DATASET: {filename}")
    print("=" * 70)

    # Load the GeoJSON file.
    gdf = gpd.read_file(file_path)

    # Basic dataset information.
    print(f"\nNumber of records: {len(gdf)}")
    print(f"Number of columns: {len(gdf.columns)}")

    # Column names.
    print("\nCOLUMNS:")
    for column in gdf.columns:
        print(f" - {column}")

    # Coordinate Reference System.
    print(f"\nCRS: {gdf.crs}")

    # Geometry information.
    print("\nGEOMETRY TYPES:")
    print(gdf.geometry.geom_type.value_counts().to_string())

    # Data types.
    print("\nDATA TYPES:")
    print(gdf.dtypes.to_string())

    # Full records because the dummy dataset is small.
    print("\nFULL DATA:")
    print(gdf.to_string())

    # Missing values.
    print("\nMISSING VALUES:")
    print(gdf.isnull().sum().to_string())

    print("\n")


def main() -> None:
    """Inspect all available raw GeoJSON datasets."""

    print("Starting GeoJSON dataset inspection...")

    for dataset in DATASETS:
        file_path = RAW_DATA_DIR / dataset

        if not file_path.exists():
            print(f"\nWARNING: File not found: {file_path}")
            continue

        inspect_dataset(dataset)

    print("Dataset inspection completed.")


if __name__ == "__main__":
    main()