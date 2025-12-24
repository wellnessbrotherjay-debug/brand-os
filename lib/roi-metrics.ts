export type RoiInput = {
  classesPerDay: number;
  clientsPerClass: number;
  occupancy: number;
  memberships: number;
  classPacks: number;
  dayPasses: number;
  avgSpend: number;
  dropInPerDay: number;
  classPrice: number;
  monthlySalaries: number;
  fixedCosts: number;
  variableCosts: number;
  membershipPrice?: number;
  dayPassPrice?: number;
  classPackPrice?: number;
  totalInvestment?: number;
};

export type RoiResult = {
  monthlyRevenue: number;
  monthlyProfit: number;
  annualRoiPercent: number;
  paybackMonths: number;
  breakevenBookingsPerDay: number;
  ebitda: number;
  monthlyCosts: number;
  revenueForecast: Array<{ month: string; value: number }>;
  occupancyCurve: Array<{ month: string; occupancy: number }>;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function computeRoi(input: RoiInput): RoiResult {
  const daysInMonth = 30;
  const occupancyFactor = Math.max(0, Math.min(100, input.occupancy)) / 100;
  const bookingsPerClass = input.clientsPerClass * occupancyFactor;
  const totalBookingsPerMonth = Math.max(0, input.classesPerDay * bookingsPerClass * daysInMonth);
  const bookingRevenue =
    totalBookingsPerMonth * input.classPrice +
    input.dropInPerDay * input.classPrice * daysInMonth;

  const memberPrice = input.membershipPrice ?? input.avgSpend * 1.1;
  const dayPassPrice = input.dayPassPrice ?? input.avgSpend * 0.9;
  const classPackPrice = input.classPackPrice ?? input.avgSpend * 1.2;

  const membershipRevenue = input.memberships * memberPrice;
  const dayPassRevenue = input.dayPasses * dayPassPrice * daysInMonth;
  const classPackRevenue = input.classPacks * classPackPrice;

  const monthlyRevenue = membershipRevenue + dayPassRevenue + classPackRevenue + bookingRevenue;
  const monthlyCosts = input.fixedCosts + input.variableCosts + input.monthlySalaries;
  const monthlyProfit = monthlyRevenue - monthlyCosts;
  const ebitda = monthlyProfit + input.monthlySalaries;

  const totalInvestment = input.totalInvestment ?? 1;
  const annualRoiPercent =
    totalInvestment > 0 ? ((monthlyProfit * 12) / totalInvestment) * 100 : 0;
  const paybackMonths = monthlyProfit > 0 ? totalInvestment / monthlyProfit : Infinity;

  const avgRevenuePerBooking = totalBookingsPerMonth > 0 ? bookingRevenue / totalBookingsPerMonth : input.avgSpend;
  const variablePerBooking = input.variableCosts / Math.max(totalBookingsPerMonth, 1);
  const breakevenBookingsPerDay =
    avgRevenuePerBooking > variablePerBooking
      ? input.fixedCosts / (daysInMonth * (avgRevenuePerBooking - variablePerBooking))
      : input.classesPerDay;

  const revenueForecast = MONTHS.map((month, index) => {
    const seasonFactor = 1 + Math.sin((index / 12) * Math.PI * 2) * 0.12;
    return { month, value: Math.round(monthlyRevenue * seasonFactor) };
  });

  const occupancyCurve = MONTHS.map((month, index) => ({
    month,
    occupancy: Math.min(100, Math.max(0, Math.round(occupancyFactor * 100 * (0.85 + Math.cos((index / 12) * Math.PI * 2) * 0.15)))),
  }));

  return {
    monthlyRevenue,
    monthlyProfit,
    annualRoiPercent,
    paybackMonths,
    breakevenBookingsPerDay,
    ebitda,
    monthlyCosts,
    revenueForecast,
    occupancyCurve,
  };
}
