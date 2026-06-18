import { FloodRiskInput, WasteRiskInput, RiskLevel, EcoRiskPrediction } from '../types';

// Simulate a trained Random Forest model's output for Flood Prediction
export function predictFloodRisk(input: FloodRiskInput): RiskLevel {
  let score = 0;
  
  // Heavily weighted variables
  if (input.rainfall > 100) score += 4;
  else if (input.rainfall > 50) score += 2;
  
  if (input.riverLevel > 7) score += 4;
  else if (input.riverLevel > 4) score += 2;
  
  if (input.soilMoisture > 80) score += 2;
  else if (input.soilMoisture > 60) score += 1;
  
  if (input.drainageCondition < 3) score += 3;
  else if (input.drainageCondition < 6) score += 1;
  
  if (input.humidity > 85) score += 1;

  if (score >= 8) return 'High';
  if (score >= 4) return 'Medium';
  return 'Low';
}

// Simulate a trained model for Waste Risk
export function predictWasteRisk(input: WasteRiskInput): RiskLevel {
    let score = 0;
    
    if (input.populationDensity > 8000) score += 3;
    else if (input.populationDensity > 3000) score += 1;
    
    if (input.collectionFrequency < 1) score += 4;
    else if (input.collectionFrequency < 3) score += 2;
    
    if (input.distanceToMarket < 1) score += 2;
    
    if (input.rainySeason) score += 2;
    
    if (input.previousReports > 15) score += 3;
    else if (input.previousReports > 5) score += 1;
    
    if (score >= 8) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
}

export function calculateEcoRisk(floodRisk: RiskLevel, wasteRisk: RiskLevel): number {
    let score = 0;
    
    const floodMap: Record<RiskLevel, number> = { 'Low': 5, 'Medium': 35, 'High': 65 };
    const wasteMap: Record<RiskLevel, number> = { 'Low': 5, 'Medium': 15, 'High': 35 };
    
    score += floodMap[floodRisk] + wasteMap[wasteRisk];
    
    return Math.min(100, score);
}
