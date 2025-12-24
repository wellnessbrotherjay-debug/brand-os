"use strict";

export type Investment = {
  id: string;
  title: string;
  category: string;
  amount: number;
  notes?: string;
};

export type Asset = {
  id: string;
  name: string;
  value: number;
};

export type FixedCost = {
  id: string;
  category: string;
  item: string;
  monthlyAmount: number;
};

export type VariableCost = {
  id: string;
  name: string;
  costType: "per_booking" | "per_member" | "per_class";
  amount: number;
};

export type RevenueProduct = {
  id: string;
  productType: "membership" | "day_pass" | "class_pack" | "other";
  name: string;
  price: number;
  durationDays?: number;
};

export type FinancialProject = {
  id: string;
  name: string;
  currency: string;
  investments: Investment[];
  assets: Asset[];
  fixedCosts: FixedCost[];
  variableCosts: VariableCost[];
  revenueProducts: RevenueProduct[];
};

export const financialProject: FinancialProject = {
  id: "proj-hotelfit-v3",
  name: "HotelFit Solutions Studio",
  currency: "USD",
  investments: [
    { id: "inv-1", title: "Studio Build-out", category: "Construction", amount: 82000 },
    { id: "inv-2", title: "Tech Stack + Indoor AV", category: "Tech", amount: 43000 },
    { id: "inv-3", title: "Equipment + Air Systems", category: "Equipment", amount: 28000 },
  ],
  assets: [
    { id: "asset-1", name: "AV + Display Pods", value: 42000 },
    { id: "asset-2", name: "Wearables + HRM Straps", value: 11000 },
  ],
  fixedCosts: [
    { id: "fixed-1", category: "Rent", item: "Studio lease", monthlyAmount: 22000 },
    { id: "fixed-2", category: "Salaries", item: "Coaches + Concierge", monthlyAmount: 18000 },
    { id: "fixed-3", category: "Utilities", item: "Gym operations", monthlyAmount: 3200 },
    { id: "fixed-4", category: "Marketing", item: "Venue promotions", monthlyAmount: 1800 },
  ],
  variableCosts: [
    { id: "var-1", name: "Per booking consumables", costType: "per_booking", amount: 4.2 },
    { id: "var-2", name: "Per member support", costType: "per_member", amount: 12 },
    { id: "var-3", name: "Per class energy", costType: "per_class", amount: 22 },
  ],
  revenueProducts: [
    { id: "rev-1", productType: "membership", name: "Platinum Monthly", price: 320, durationDays: 30 },
    { id: "rev-2", productType: "day_pass", name: "Drop-in Experience", price: 55, durationDays: 1 },
    { id: "rev-3", productType: "class_pack", name: "8-Class Pack", price: 380, durationDays: 90 },
  ],
};

export type ScenarioInput = {
  name: string;
  avgClassesPerDay: number;
  avgClientsPerClass: number;
  avgMemberships: number;
  avgDayPassesPerDay: number;
  avgClassPacksPerMonth: number;
  occupancyPercent: number;
  bookingPricePerClient: number;
  membershipPriceOverride?: number;
  dayPassPriceOverride?: number;
  classPackPriceOverride?: number;
  daysInMonth?: number;
};

export type ScenarioKpi = {
  scenarioName: string;
  totalMonthlyRevenue: number;
  totalMonthlyFixedCosts: number;
  totalMonthlyVariableCosts: number;
  totalMonthlyProfit: number;
  breakevenBookingsPerDay: number;
  paybackMonths: number;
  annualRoiPercent: number;
  lastComputedAt: string;
};

const baseDaysInMonth = 30;

export const scenarioPresets: Record<string, ScenarioInput> = {
  base: {
    name: "Base Case",
    avgClassesPerDay: 4,
    avgClientsPerClass: 10,
    avgMemberships: 160,
    avgDayPassesPerDay: 12,
    avgClassPacksPerMonth: 45,
    occupancyPercent: 82,
    bookingPricePerClient: 65,
    daysInMonth: baseDaysInMonth,
  },
  conservative: {
    name: "Conservative",
    avgClassesPerDay: 2,
    avgClientsPerClass: 8,
    avgMemberships: 110,
    avgDayPassesPerDay: 8,
    avgClassPacksPerMonth: 25,
    occupancyPercent: 60,
    bookingPricePerClient: 58,
    daysInMonth: baseDaysInMonth,
  },
  aggressive: {
    name: "Aggressive",
    avgClassesPerDay: 5,
    avgClientsPerClass: 12,
    avgMemberships: 210,
    avgDayPassesPerDay: 20,
    avgClassPacksPerMonth: 70,
    occupancyPercent: 94,
    bookingPricePerClient: 82,
    daysInMonth: baseDaysInMonth,
  },
};

export type CompetitorBenchmark = {
  name: string;
  dropIn: number;
  membership: number;
  classPack: number;
  notes: string;
};

export const competitorBenchmarks: CompetitorBenchmark[] = [
  {
    name: "Paradise Bali",
    dropIn: 72,
    membership: 395,
    classPack: 410,
    notes: "Premium wellness villa partner.",
  },
  {
    name: "Body Factory",
    dropIn: 60,
    membership: 320,
    classPack: 360,
    notes: "High-volume urban studio.",
  },
  {
    name: "Ocean Club",
    dropIn: 52,
    membership: 280,
    classPack: 300,
    notes: "Boutique wellness retreat experience.",
  },
];

const sumInvestments = (project: FinancialProject) =>
  project.investments.reduce((total, investment) => total + investment.amount, 0);

const sumFixedCosts = (project: FinancialProject) =>
  project.fixedCosts.reduce((total, cost) => total + cost.monthlyAmount, 0);

const sumVariableAmount = (project: FinancialProject, type: VariableCost["costType"]) =>
  project.variableCosts
    .filter((cost) => cost.costType === type)
    .reduce((total, cost) => total + cost.amount, 0);

export function computeScenarioKpis(project: FinancialProject, scenario: ScenarioInput): ScenarioKpi {
  const membershipProduct = project.revenueProducts.find((product) => product.productType === "membership");
  const dayPassProduct = project.revenueProducts.find((product) => product.productType === "day_pass");
  const classPackProduct = project.revenueProducts.find((product) => product.productType === "class_pack");

  const membershipPrice = scenario.membershipPriceOverride ?? membershipProduct?.price ?? 0;
  const dayPassPrice = scenario.dayPassPriceOverride ?? dayPassProduct?.price ?? 0;
  const classPackPrice = scenario.classPackPriceOverride ?? classPackProduct?.price ?? 0;
  const days = scenario.daysInMonth ?? baseDaysInMonth;

  const membershipRevenue = scenario.avgMemberships * membershipPrice;
  const dayPassRevenue = scenario.avgDayPassesPerDay * dayPassPrice * days;
  const classPackRevenue = scenario.avgClassPacksPerMonth * classPackPrice;
  const bookingRevenue = scenario.avgClassesPerDay * scenario.avgClientsPerClass * scenario.bookingPricePerClient * days;

  const totalMonthlyRevenue = membershipRevenue + dayPassRevenue + classPackRevenue + bookingRevenue;
  const totalMonthlyFixedCosts = sumFixedCosts(project);
  const bookingsPerMonth = scenario.avgClassesPerDay * scenario.avgClientsPerClass * days;
  const perBookingCost = sumVariableAmount(project, "per_booking");
  const perMemberCost = sumVariableAmount(project, "per_member");
  const perClassCost = sumVariableAmount(project, "per_class");

  const totalVariableCost =
    bookingsPerMonth * perBookingCost +
    scenario.avgMemberships * perMemberCost +
    scenario.avgClassesPerDay * days * perClassCost;

  const totalMonthlyProfit = totalMonthlyRevenue - totalMonthlyFixedCosts - totalVariableCost;
  const totalInvestment = sumInvestments(project);

  const avgRevenuePerBooking = bookingsPerMonth > 0 ? bookingRevenue / bookingsPerMonth : scenario.bookingPricePerClient;
  const breakevenDenominator = avgRevenuePerBooking - perBookingCost;
  const breakevenBookingsPerDay =
    breakevenDenominator > 0 ? (totalMonthlyFixedCosts / days / breakevenDenominator) : scenario.avgClassesPerDay;

  const paybackMonths = totalMonthlyProfit > 0 ? totalInvestment / totalMonthlyProfit : Infinity;
  const annualRoiPercent = totalInvestment > 0 ? (totalMonthlyProfit * 12) / totalInvestment * 100 : 0;

  return {
    scenarioName: scenario.name,
    totalMonthlyRevenue,
    totalMonthlyFixedCosts,
    totalMonthlyVariableCosts: totalVariableCost,
    totalMonthlyProfit,
    breakevenBookingsPerDay,
    paybackMonths,
    annualRoiPercent,
    lastComputedAt: new Date().toISOString(),
  };
}
