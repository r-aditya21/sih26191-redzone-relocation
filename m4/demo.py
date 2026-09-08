from m4.schemas import Zone, Habitation, SafeSite
from m4.risk_engine import (
    calculate_habitation_priorities,
    calculate_site_suitability,
)

def main():
    # ---------------------------------------------------------
    # 1. SAMPLE HAZARD ZONES
    # ---------------------------------------------------------

    zones = [
        Zone(
            zone_id="Z1",
            hazard_type="landslide",
            risk_level="high",
        ),
        Zone(
            zone_id="Z2",
            hazard_type="flood",
            risk_level="medium",
        ),
        Zone(
            zone_id="Z3",
            hazard_type="erosion",
            risk_level="low",
        ),
    ]

    # ---------------------------------------------------------
    # 2. SAMPLE HABITATIONS
    # ---------------------------------------------------------

    habitations = [
        Habitation(
            habitation_id="H1",
            name="Village A",
            population=1200,
            current_zone_id="Z1",
        ),
        Habitation(
            habitation_id="H2",
            name="Village B",
            population=700,
            current_zone_id="Z2",
        ),
        Habitation(
            habitation_id="H3",
            name="Village C",
            population=250,
            current_zone_id="Z3",
        ),
    ]

    # ---------------------------------------------------------
    # 3. CALCULATE RELOCATION PRIORITY
    # ---------------------------------------------------------

    priority_results = calculate_habitation_priorities(
        habitations,
        zones,
    )

    print("\n" + "=" * 60)
    print("SAFE SHIFT — HABITATION RELOCATION PRIORITY")
    print("=" * 60)

    for rank, result in enumerate(priority_results, start=1):
        print(
            f"\nRank {rank}: {result['name']}"
        )
        print(
            f"  Priority Score : {result['priority_score']:.3f}"
        )
        print(
            f"  Priority       : {result['priority']}"
        )
        print(
            f"  Risk Level     : "
            f"{result['explanation']['risk_level']}"
        )
        print(
            f"  Population     : "
            f"{result['explanation']['population']}"
        )
        print(
            f"  Risk Contribution : "
            f"{result['explanation']['risk_contribution']:.3f}"
        )
        print(
            f"  Population Contribution : "
            f"{result['explanation']['population_contribution']:.3f}"
        )

    # ---------------------------------------------------------
    # 4. SAMPLE SAFE RELOCATION SITES
    # ---------------------------------------------------------

    sites = [
        SafeSite(
            site_id="S1",
            capacity_score=0.90,
            available_land=12.0,
            infra_access=0.90,
        ),
        SafeSite(
            site_id="S2",
            capacity_score=0.70,
            available_land=8.0,
            infra_access=0.75,
        ),
        SafeSite(
            site_id="S3",
            capacity_score=0.45,
            available_land=3.0,
            infra_access=0.40,
        ),
    ]

    # ---------------------------------------------------------
    # 5. CALCULATE SAFE-SITE SUITABILITY
    # ---------------------------------------------------------

    site_results = calculate_site_suitability(sites)

    print("\n" + "=" * 60)
    print("SAFE SHIFT — SAFE-SITE SUITABILITY")
    print("=" * 60)

    for rank, result in enumerate(site_results, start=1):
        print(
            f"\nRank {rank}: {result['site_id']}"
        )
        print(
            f"  Suitability Score : "
            f"{result['suitability_score']:.3f}"
        )
        print(
            f"  Capacity          : "
            f"{result['explanation']['capacity_score']:.3f}"
        )
        print(
            f"  Available Land    : "
            f"{result['explanation']['available_land']:.1f} ha"
        )
        print(
            f"  Infrastructure    : "
            f"{result['explanation']['infra_access']:.3f}"
        )
        print(
            f"  Capacity Contribution : "
            f"{result['explanation']['capacity_contribution']:.3f}"
        )
        print(
            f"  Land Contribution : "
            f"{result['explanation']['land_contribution']:.3f}"
        )
        print(
            f"  Infrastructure Contribution : "
            f"{result['explanation']['infrastructure_contribution']:.3f}"
        )

    print("\n" + "=" * 60)
    print("M4 DEMO COMPLETED")
    print("=" * 60)


if __name__ == "__main__":
    main()