export interface IDateRangeQuery {
  startDate?: string;
  endDate?: string;
  animalId?: string;
  search?: string;
}

export interface IMilkProductionReportResponse {
  summary: {
    totalMilkProduction: number;
    averageMilkProduction: number;
  };
  topMilkProducingAnimals: Array<{
    animalId: string;
    animalName: string;
    earTag: string;
    totalMilkProduction: number;
    averageMilkProduction: number;
    recordCount: number;
  }>;
  records: Array<{
    _id: string;
    animalId: string;
    animalName: string;
    earTag: string;
    date: string;
    session: 'Morning' | 'Evening';
    quantityProduced: number;
  }>;
}

export interface IMilkInventoryReportResponse {
  summary: {
    totalMilk: number;
    milkSold: number;
    milkUsed: number;
    remainingMilk: number;
    totalMilkSold: number;
    totalRevenue: number;
  };
  records: Array<{
    date: string;
    totalMilk: number;
    milkSold: number;
    milkUsed: number;
    remainingMilk: number;
  }>;
  dailyChart: Array<{
    date: string;
    totalMilk: number;
    milkSold: number;
    remainingMilk: number;
  }>;
  monthlyChart: Array<{
    month: string;
    totalMilk: number;
    milkSold: number;
    remainingMilk: number;
  }>;
}

export interface IAnimalReportResponse {
  summary: {
    totalAnimals: number;
    activeAnimals: number;
  };
  breedStats: Array<{ breed: string; count: number }>;
  genderStats: Array<{ gender: string; count: number }>;
  lactationStageStats: Array<{ stage: string; count: number }>;
  reproductiveStatusStats: Array<{ status: string; count: number }>;
}

export interface IHealthReportResponse {
  summary: {
    totalRecords: number;
    totalTreatmentExpenses: number;
    recoveredCases: number;
    activeCases: number;
  };
  chartData: Array<{ name: string; value: number }>;
  records: Array<{
    _id: string;
    animalName: string;
    earTag: string;
    disease: string;
    treatment: string;
    medicine: string;
    treatmentCost: number;
    recoveryStatus: string;
    startDate: string;
  }>;
}

export interface IBreedingReportResponse {
  summary: {
    totalBreedingRecords: number;
    totalPregnantAnimals: number;
    inseminatedAnimals: number;
  };
  breedingTypeStats: Array<{ breedingType: string; count: number }>;
  records: Array<{
    _id: string;
    animalName: string;
    earTag: string;
    breedingDate: string;
    breedingType: string;
    semenBullInfo: string;
    pregnancyStatus: string;
    calvingDate: string;
  }>;
}

export interface IFinancialSummaryResponse {
  kpis: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    totalAnimals: number;
    monthlyMilkProduction: number;
  };
  charts: {
    revenueVsExpenses: Array<{ month: string; revenue: number; expenses: number }>;
    monthlyProfitTrend: Array<{ month: string; profit: number }>;
    monthlyMilkProduction: Array<{ month: string; production: number }>;
  };
  breakdown: {
    milkRevenue: number;
    treatmentExpenses: number;
    feedExpenses: number;
    laborExpenses: number;
  };
}