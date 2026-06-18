export type FloodRiskInput = {
  rainfall: number;
  humidity: number;
  temperature: number;
  riverLevel: number;
  soilMoisture: number;
  drainageCondition: number; // 0-10 (0: very bad, 10: excellent)
};

export type WasteRiskInput = {
  populationDensity: number;
  collectionFrequency: number;
  distanceToMarket: number;
  previousReports: number;
  rainySeason: boolean; // boolean represented as 1/0 inside logic if needed
};

export type RiskLevel = 'Low' | 'Medium' | 'High';

export type EcoRiskPrediction = {
  floodRisk: RiskLevel;
  wasteRisk: RiskLevel;
  overallScore: number; // 0-100
};
