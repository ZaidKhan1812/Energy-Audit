import numpy as np
import random
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

RATE_PER_KWH = 8.0
DAYS = 30
NUM_APPLIANCES = 15
LINE = "=" * 60

APPLIANCE_INFO = [
    (1,  "Air Conditioner",  1.80, 1500),
    (2,  "Refrigerator",     1.20, 200),
    (3,  "Water Heater",     1.50, 2000),
    (4,  "Washing Machine",  0.90, 500),
    (5,  "Microwave Oven",   0.25, 1000),
    (6,  "Television",       0.20, 100),
    (7,  "Laptop",           0.15, 65),
    (8,  "Ceiling Fan",      0.08, 75),
    (9,  "Electric Iron",    0.20, 1000),
    (10, "Dishwasher",       1.10, 1800),
    (11, "Electric Kettle",  0.18, 1500),
    (12, "Hair Dryer",       0.10, 1200),
    (13, "Vacuum Cleaner",   0.15, 800),
    (14, "LED Lights (all)", 0.12, 50),
    (15, "Wi-Fi Router",     0.05, 10),
]

names = [info[1] for info in APPLIANCE_INFO]

def generate_usage_data():
    random.seed(42)
    data = np.zeros((NUM_APPLIANCES, DAYS))
    for i, (_, _, avg_kwh, _) in enumerate(APPLIANCE_INFO):
        for d in range(DAYS):
            data[i][d] = round(avg_kwh * random.uniform(0.80, 1.20), 4)
    return data

def bubble_sort_by_consumption(totals):
    indices = list(range(NUM_APPLIANCES))
    n = len(indices)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if totals[indices[j]] < totals[indices[j + 1]]:
                indices[j], indices[j + 1] = indices[j + 1], indices[j]
    return indices

def linear_search(query, names):
    query = query.lower()
    return [i for i, name in enumerate(names) if query in name.lower()]

def compute_monthly_totals(data):
    return np.sum(data, axis=1)

def compute_monthly_costs(totals):
    return totals * RATE_PER_KWH

def compute_daily_avg(data):
    return np.mean(data, axis=0)

def get_replacement_candidates(totals):
    threshold = np.percentile(totals, 75)
    return [i for i in range(NUM_APPLIANCES) if totals[i] > threshold], threshold

def print_header():
    print(LINE)
    print("   HOME APPLIANCE ENERGY AUDITOR")
    print("   Smart Home Energy Management System")
    print(LINE)

def display_all(data, totals, costs):
    print(f"\n{'─'*60}")
    print(f"{'ID':<4} {'Appliance':<22} {'30-Day kWh':>10} {'Monthly Cost':>13}")
    print(f"{'─'*60}")
    for i, info in enumerate(APPLIANCE_INFO):
        print(f"{info[0]:<4} {info[1]:<22} {totals[i]:>10.2f} {'₹'+str(round(costs[i],2)):>13}")
    print(f"{'─'*60}")
    print(f"{'TOTAL':<26} {np.sum(totals):>10.2f} {'₹'+str(round(np.sum(costs),2)):>13}")
    print(f"{'─'*60}")

def display_ranking(totals, costs):
    sorted_idx = bubble_sort_by_consumption(totals)
    print(f"\n  {'Rank':<6} {'Appliance':<22} {'kWh/month':>10} {'Cost (₹)':>10}")
    print(f"  {'─'*52}")
    for rank, idx in enumerate(sorted_idx, 1):
        print(f"  {rank:<6} {names[idx]:<22} {totals[idx]:>10.2f} {costs[idx]:>10.2f}")

def display_recommendations(totals):
    candidates, threshold = get_replacement_candidates(totals)
    costs = compute_monthly_costs(totals)
    print(f"\n  75th Percentile Threshold : {threshold:.2f} kWh/month")
    print(f"\n  Appliances recommended for replacement:")
    print(f"  {'─'*50}")
    for idx in candidates:
        overage = (totals[idx] - threshold) * RATE_PER_KWH
        print(f"  ⚠  {names[idx]:<22} | {totals[idx]:.2f} kWh | Overage cost: ₹{overage:.2f}/month")
    saving = sum((totals[i] - threshold) * RATE_PER_KWH for i in candidates)
    print(f"\n  Tip: Replacing these could save ₹{saving:.2f}/month.")

def display_search(totals, costs):
    query = input("\n  Enter appliance name to search: ").strip()
    results = linear_search(query, names)
    if not results:
        print(f"  No appliance found matching '{query}'.")
    else:
        print(f"\n  {'Appliance':<22} {'30-Day kWh':>10} {'Monthly Cost':>13} {'Wattage':>9}")
        print(f"  {'─'*58}")
        for idx in results:
            info = APPLIANCE_INFO[idx]
            print(f"  {info[1]:<22} {totals[idx]:>10.2f} {'₹'+str(round(costs[idx],2)):>13} {info[3]:>7}W")

def display_daily(data):
    daily = compute_daily_avg(data)
    peak = np.argmax(daily) + 1
    low = np.argmin(daily) + 1
    print(f"\n  Average total household consumption per day:")
    print(f"  {'─'*40}")
    print(f"  Overall daily avg  : {np.mean(daily):.4f} kWh")
    print(f"  Peak day           : Day {peak}  ({daily[peak-1]:.4f} kWh)")
    print(f"  Lowest usage day   : Day {low}  ({daily[low-1]:.4f} kWh)")
    print(f"  Std deviation      : {np.std(daily):.4f} kWh")

def main():
    data = generate_usage_data()
    totals = compute_monthly_totals(data)
    costs = compute_monthly_costs(totals)
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
        ch = input("  Enter choice (1-6): ").strip()

        if   ch == "1": display_all(data, totals, costs)
        elif ch == "2": display_ranking(totals, costs)
        elif ch == "3": display_recommendations(totals)
        elif ch == "4": display_search(totals, costs)
        elif ch == "5": display_daily(data)
        elif ch == "6": print("\n  Thank you for using the Energy Auditor. Goodbye!\n"); break
        else: print("  Invalid choice. Enter a number from 1 to 6.")

if __name__ == "__main__":
    main()
