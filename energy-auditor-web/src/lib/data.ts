// ============================================================
// Core data & computation — mirrors energy_auditor.py logic
// No database; all computed in-memory on the client
// ============================================================

export const RATE_PER_KWH = 8.0; // ₹ per kWh
export const DAYS = 30;
export const NUM_APPLIANCES = 15;

export interface ApplianceInfo {
  id: number;
  name: string;
  avgDailyKwh: number;
  wattage: number;
  icon: string;
}

export const APPLIANCE_INFO: ApplianceInfo[] = [
  { id: 1,  name: "Air Conditioner",    avgDailyKwh: 1.80, wattage: 1500, icon: "❄️" },
  { id: 2,  name: "Refrigerator",       avgDailyKwh: 1.20, wattage: 200,  icon: "🧊" },
  { id: 3,  name: "Water Heater",       avgDailyKwh: 1.50, wattage: 2000, icon: "🔥" },
  { id: 4,  name: "Washing Machine",    avgDailyKwh: 0.90, wattage: 500,  icon: "🫧" },
  { id: 5,  name: "Microwave Oven",     avgDailyKwh: 0.25, wattage: 1000, icon: "📡" },
  { id: 6,  name: "Television",         avgDailyKwh: 0.20, wattage: 100,  icon: "📺" },
  { id: 7,  name: "Laptop",             avgDailyKwh: 0.15, wattage: 65,   icon: "💻" },
  { id: 8,  name: "Ceiling Fan",        avgDailyKwh: 0.08, wattage: 75,   icon: "🌀" },
  { id: 9,  name: "Electric Iron",      avgDailyKwh: 0.20, wattage: 1000, icon: "🧺" },
  { id: 10, name: "Dishwasher",         avgDailyKwh: 1.10, wattage: 1800, icon: "🍽️" },
  { id: 11, name: "Electric Kettle",    avgDailyKwh: 0.18, wattage: 1500, icon: "☕" },
  { id: 12, name: "Hair Dryer",         avgDailyKwh: 0.10, wattage: 1200, icon: "💨" },
  { id: 13, name: "Vacuum Cleaner",     avgDailyKwh: 0.15, wattage: 800,  icon: "🧹" },
  { id: 14, name: "LED Lights (all)",   avgDailyKwh: 0.12, wattage: 50,   icon: "💡" },
  { id: 15, name: "Wi-Fi Router",       avgDailyKwh: 0.05, wattage: 10,   icon: "📶" },
];

// Seeded pseudo-random (mirrors Python random.seed(42))
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export interface ApplianceRecord {
  info: ApplianceInfo;
  dailyKwh: number[];
  monthlyTotal: number;
  monthlyCost: number;
  rank?: number;
}

export interface AuditData {
  appliances: ApplianceRecord[];
  sortedByConsumption: ApplianceRecord[];
  replacementCandidates: ApplianceRecord[];
  percentileThreshold: number;
  totalMonthlyKwh: number;
  totalMonthlyCost: number;
  dailyTotals: number[];
  dailyAvg: number;
  peakDay: number;
  lowestDay: number;
  stdDev: number;
  potentialSaving: number;
}

function percentile75(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = 0.75 * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function stdDeviation(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function generateAuditData(): AuditData {
  const rng = seededRandom(42);

  // Build daily kWh matrix (15 × 30) with ±20% variation
  const appliances: ApplianceRecord[] = APPLIANCE_INFO.map((info) => {
    const dailyKwh = Array.from({ length: DAYS }, () => {
      const variation = 0.80 + rng() * 0.40; // 0.80 – 1.20
      return parseFloat((info.avgDailyKwh * variation).toFixed(4));
    });
    const monthlyTotal = parseFloat(dailyKwh.reduce((a, b) => a + b, 0).toFixed(2));
    const monthlyCost  = parseFloat((monthlyTotal * RATE_PER_KWH).toFixed(2));
    return { info, dailyKwh, monthlyTotal, monthlyCost };
  });

  // Bubble sort (mirrors Python implementation) — descending by monthlyTotal
  const sortedByConsumption = [...appliances];
  const n = sortedByConsumption.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (sortedByConsumption[j].monthlyTotal < sortedByConsumption[j + 1].monthlyTotal) {
        [sortedByConsumption[j], sortedByConsumption[j + 1]] =
          [sortedByConsumption[j + 1], sortedByConsumption[j]];
      }
    }
  }
  sortedByConsumption.forEach((a, idx) => (a.rank = idx + 1));

  // 75th percentile threshold
  const totals = appliances.map((a) => a.monthlyTotal);
  const percentileThreshold = parseFloat(percentile75(totals).toFixed(2));
  const replacementCandidates = appliances.filter(
    (a) => a.monthlyTotal > percentileThreshold
  );

  // Totals
  const totalMonthlyKwh  = parseFloat(totals.reduce((a, b) => a + b, 0).toFixed(2));
  const totalMonthlyCost = parseFloat((totalMonthlyKwh * RATE_PER_KWH).toFixed(2));

  // Daily totals across all appliances (shape: 30)
  const dailyTotals = Array.from({ length: DAYS }, (_, d) =>
    parseFloat(appliances.reduce((sum, a) => sum + a.dailyKwh[d], 0).toFixed(4))
  );
  const dailyAvg = parseFloat((dailyTotals.reduce((a, b) => a + b, 0) / DAYS).toFixed(4));
  const peakDay  = dailyTotals.indexOf(Math.max(...dailyTotals)) + 1;
  const lowestDay = dailyTotals.indexOf(Math.min(...dailyTotals)) + 1;
  const stdDev   = parseFloat(stdDeviation(dailyTotals).toFixed(4));

  const potentialSaving = parseFloat(
    replacementCandidates
      .reduce((sum, a) => sum + (a.monthlyTotal - percentileThreshold) * RATE_PER_KWH, 0)
      .toFixed(2)
  );

  return {
    appliances,
    sortedByConsumption,
    replacementCandidates,
    percentileThreshold,
    totalMonthlyKwh,
    totalMonthlyCost,
    dailyTotals,
    dailyAvg,
    peakDay,
    lowestDay,
    stdDev,
    potentialSaving,
  };
}
