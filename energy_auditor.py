# ============================================================
# Project  : Home Appliance Energy Auditor
# Group    : Div C | Group 63 | Project Statement 110
# Members  : Khan Zaid | Omkar Mhaske | Tanvi Bajrang Waghmare
# Course   : Python for Logic Development and Programming
#            (PLDP - BTECAI25204 / BTECAM25204 / BTECAD25204)
# Date     : April 2026
# AI Help  : Claude AI (code structure guidance, logic review)
# ============================================================
# NOTE: All code was written, tested, and understood by the
#       group personally. AI was used only for learning help.
# ============================================================

import numpy as np
import random
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# ─────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────
RATE_PER_KWH = 8.0          # ₹ per kWh (average Indian domestic rate)
DAYS = 30
NUM_APPLIANCES = 15
LINE = "=" * 60

# ─────────────────────────────────────────────
# DATA SETUP  (Python Fundamentals — 2D structure)
# Each entry: [ApplianceID, Name, DailyKWh_avg, Wattage]
# DailyKWh_avg is randomised slightly to simulate real usage
# ─────────────────────────────────────────────

APPLIANCE_INFO = [
    (1,  "Air Conditioner",    1.80, 1500),
    (2,  "Refrigerator",       1.20, 200),
    (3,  "Water Heater",       1.50, 2000),
    (4,  "Washing Machine",    0.90, 500),
    (5,  "Microwave Oven",     0.25, 1000),
    (6,  "Television",         0.20, 100),
    (7,  "Laptop",             0.15, 65),
    (8,  "Ceiling Fan",        0.08, 75),
    (9,  "Electric Iron",      0.20, 1000),
    (10, "Dishwasher",         1.10, 1800),
    (11, "Electric Kettle",    0.18, 1500),
    (12, "Hair Dryer",         0.10, 1200),
    (13, "Vacuum Cleaner",     0.15, 800),
    (14, "LED Lights (all)",   0.12, 50),
    (15, "Wi-Fi Router",       0.05, 10),
]

def generate_usage_data():
    """
    Build a 2D NumPy array of shape (NUM_APPLIANCES, DAYS).
    Each cell = kWh consumed by that appliance on that day.
    Random variation of ±20% around the average simulates real usage.
    """
    random.seed(42)          # fixed seed → reproducible output
    data = np.zeros((NUM_APPLIANCES, DAYS))
    for i, (_, _, avg_kwh, _) in enumerate(APPLIANCE_INFO):
        for d in range(DAYS):
            variation = random.uniform(0.80, 1.20)
            data[i][d] = round(avg_kwh * variation, 4)
    return data

# ─────────────────────────────────────────────
# SORTING  (bubble sort — clear & explainable)
# ─────────────────────────────────────────────

def bubble_sort_by_consumption(totals):
    """
    Bubble Sort on index array, sorted by total monthly consumption.
    Returns indices sorted from highest to lowest consumption.
    """
    indices = list(range(NUM_APPLIANCES))
    n = len(indices)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if totals[indices[j]] < totals[indices[j + 1]]:
                indices[j], indices[j + 1] = indices[j + 1], indices[j]
    return indices

# ─────────────────────────────────────────────
# SEARCHING  (linear search by name)
# ─────────────────────────────────────────────

def linear_search(name_query, names):
    """Linear search — finds appliance index by partial name match."""
    name_query = name_query.lower()
    results = []
    for i, name in enumerate(names):
        if name_query in name.lower():
            results.append(i)
    return results

# ─────────────────────────────────────────────
# NumPy PROCESSING
# ─────────────────────────────────────────────

def compute_monthly_totals(usage_data):
    """Sum 30 days for each appliance using NumPy."""
    return np.sum(usage_data, axis=1)              # shape: (15,)

def compute_monthly_costs(monthly_totals):
    """Broadcasting: multiply every element by rate at once."""
    return monthly_totals * RATE_PER_KWH           # shape: (15,)

def compute_daily_avg(usage_data):
    """Daily average across all appliances using NumPy."""
    return np.mean(usage_data, axis=0)             # shape: (30,)

# ─────────────────────────────────────────────
# DATA ANALYSIS — 75th percentile threshold
# ─────────────────────────────────────────────

def get_replacement_candidates(monthly_totals):
    """
    Recommend replacement for appliances consuming > 75th percentile.
    Returns list of indices that exceed the threshold.
    """
    threshold = np.percentile(monthly_totals, 75)
    candidates = [i for i in range(NUM_APPLIANCES) if monthly_totals[i] > threshold]
    return candidates, threshold

# ─────────────────────────────────────────────
# DISPLAY HELPERS
# ─────────────────────────────────────────────

names = [info[1] for info in APPLIANCE_INFO]

def print_header():
    print(LINE)
    print("   HOME APPLIANCE ENERGY AUDITOR")
    print("   Smart Home Energy Management System")
    print(LINE)

def display_all_appliances(usage_data, monthly_totals, monthly_costs):
    print(f"\n{'─'*60}")
    print(f"{'ID':<4} {'Appliance':<22} {'30-Day kWh':>10} {'Monthly Cost':>13}")
    print(f"{'─'*60}")
    for i, info in enumerate(APPLIANCE_INFO):
        print(f"{info[0]:<4} {info[1]:<22} {monthly_totals[i]:>10.2f} "
              f"{'₹' + str(round(monthly_costs[i], 2)):>13}")
    print(f"{'─'*60}")
    print(f"{'TOTAL':<26} {np.sum(monthly_totals):>10.2f} "
          f"{'₹' + str(round(np.sum(monthly_costs), 2)):>13}")
    print(f"{'─'*60}")

def display_sorted_ranking(usage_data, monthly_totals, monthly_costs):
    sorted_indices = bubble_sort_by_consumption(monthly_totals)
    print(f"\n  {'Rank':<6} {'Appliance':<22} {'kWh/month':>10} {'Cost (₹)':>10}")
    print(f"  {'─'*52}")
    for rank, idx in enumerate(sorted_indices, start=1):
        print(f"  {rank:<6} {names[idx]:<22} {monthly_totals[idx]:>10.2f} "
              f"{monthly_costs[idx]:>10.2f}")

def display_recommendations(monthly_totals):
    candidates, threshold = get_replacement_candidates(monthly_totals)
    monthly_costs = compute_monthly_costs(monthly_totals)
    print(f"\n  75th Percentile Threshold : {threshold:.2f} kWh/month")
    print(f"\n  Appliances recommended for replacement:")
    print(f"  {'─'*50}")
    if not candidates:
        print("  None — all appliances are within efficient range.")
    else:
        for idx in candidates:
            saving_estimate = (monthly_totals[idx] - threshold) * RATE_PER_KWH
            print(f"  ⚠  {names[idx]:<22} | {monthly_totals[idx]:.2f} kWh "
                  f"| Overage cost: ₹{saving_estimate:.2f}/month")
    print(f"\n  Tip: Replacing these with energy-efficient models could save")
    print(f"       ₹{sum((monthly_totals[i]-threshold)*RATE_PER_KWH for i in candidates):.2f}/month.")

def display_search_result(usage_data, monthly_totals, monthly_costs):
    query = input("\n  Enter appliance name to search: ").strip()
    results = linear_search(query, names)
    if not results:
        print(f"  No appliance found matching '{query}'.")
    else:
        print(f"\n  {'Appliance':<22} {'30-Day kWh':>10} {'Monthly Cost':>13} {'Wattage':>9}")
        print(f"  {'─'*58}")
        for idx in results:
            info = APPLIANCE_INFO[idx]
            print(f"  {info[1]:<22} {monthly_totals[idx]:>10.2f} "
                  f"{'₹'+str(round(monthly_costs[idx],2)):>13} {info[3]:>7}W")

def display_daily_avg(usage_data):
    daily_avg = compute_daily_avg(usage_data)
    print(f"\n  Average total household consumption per day:")
    print(f"  {'─'*40}")
    peak_day = np.argmax(daily_avg) + 1
    low_day  = np.argmin(daily_avg) + 1
    print(f"  Overall daily avg  : {np.mean(daily_avg):.4f} kWh")
    print(f"  Peak day           : Day {peak_day}  ({daily_avg[peak_day-1]:.4f} kWh)")
    print(f"  Lowest usage day   : Day {low_day}  ({daily_avg[low_day-1]:.4f} kWh)")
    print(f"  Std deviation      : {np.std(daily_avg):.4f} kWh")

# ─────────────────────────────────────────────
# MAIN — menu-driven console interface
# ─────────────────────────────────────────────

def main():
    # Generate data once at startup
    usage_data      = generate_usage_data()
    monthly_totals  = compute_monthly_totals(usage_data)
    monthly_costs   = compute_monthly_costs(monthly_totals)

    print_header()
    print(f"\n  Electricity Rate   : ₹{RATE_PER_KWH:.2f} per kWh")
    print(f"  Appliances tracked : {NUM_APPLIANCES}")
    print(f"  Monitoring period  : {DAYS} days")

    while True:
        print(f"\n{LINE}")
        print("  MENU")
        print(f"{'─'*60}")
        print("  1. View all appliances (consumption + cost)")
        print("  2. Ranked list — highest to lowest consumption")
        print("  3. Replacement recommendations (>75th percentile)")
        print("  4. Search appliance by name")
        print("  5. Daily usage statistics")
        print("  6. Exit")
        print(f"{'─'*60}")
        choice = input("  Enter choice (1-6): ").strip()

        if choice == "1":
            display_all_appliances(usage_data, monthly_totals, monthly_costs)
        elif choice == "2":
            display_sorted_ranking(usage_data, monthly_totals, monthly_costs)
        elif choice == "3":
            display_recommendations(monthly_totals)
        elif choice == "4":
            display_search_result(usage_data, monthly_totals, monthly_costs)
        elif choice == "5":
            display_daily_avg(usage_data)
        elif choice == "6":
            print("\n  Thank you for using the Energy Auditor. Goodbye!\n")
            break
        else:
            print("  Invalid choice. Enter a number from 1 to 6.")

if __name__ == "__main__":
    main()
