import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { predictFloodRisk } from '@/src/lib/ml';
import { FloodRiskInput, RiskLevel } from '@/src/types';
import { Droplets, CloudRain, Thermometer, Waves, Activity } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

export function PredictionForm() {
  const [form, setForm] = useState<FloodRiskInput>({
    rainfall: 0,
    humidity: 0,
    temperature: 0,
    riverLevel: 0,
    soilMoisture: 0,
    drainageCondition: 5,
  });

  const [result, setResult] = useState<RiskLevel | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prediction = predictFloodRisk(form);
    setResult(prediction);
    
    // Save to Supabase if configured
    if (supabase) {
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('flood_predictions')
          .insert([
            { 
              input_data: form, 
              risk_level: prediction, 
              created_at: new Date().toISOString() 
            }
          ]);
        
        if (error) {
          console.error("Error saving to Supabase:", error);
        }
      } catch (err) {
        console.error("Failed to connect to Supabase:", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const getBadgeVariant = (risk: RiskLevel) => {
    if (risk === 'High') return 'destructive';
    if (risk === 'Medium') return 'warning';
    return 'success';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Flood Prediction</h1>
        <p className="text-slate-500">Évaluez le risque d'inondation d'une zone via notre modèle Random Forest.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Paramètres Environnementaux</CardTitle>
              <CardDescription>Saisissez la télémétrie locale pour générer l'inférence.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rainfall" className="flex items-center gap-2"><CloudRain className="w-4 h-4 text-blue-500"/> Rainfall (mm)</Label>
                <Input id="rainfall" type="number" value={form.rainfall} onChange={(e) => setForm({...form, rainfall: Number(e.target.value)})} placeholder="Ex: 120" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="humidity" className="flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-400"/> Humidity (%)</Label>
                <Input id="humidity" type="number" value={form.humidity} onChange={(e) => setForm({...form, humidity: Number(e.target.value)})} placeholder="Ex: 85" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature" className="flex items-center gap-2"><Thermometer className="w-4 h-4 text-red-400"/> Temp (°C)</Label>
                  <Input id="temperature" type="number" value={form.temperature} onChange={(e) => setForm({...form, temperature: Number(e.target.value)})} placeholder="Ex: 28" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="riverLevel" className="flex items-center gap-2"><Waves className="w-4 h-4 text-teal-500"/> River Level (m)</Label>
                  <Input id="riverLevel" type="number" step="0.1" value={form.riverLevel} onChange={(e) => setForm({...form, riverLevel: Number(e.target.value)})} placeholder="Ex: 5.2" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="soilMoisture">Soil Moisture (%)</Label>
                  <Input id="soilMoisture" type="number" value={form.soilMoisture} onChange={(e) => setForm({...form, soilMoisture: Number(e.target.value)})} placeholder="Ex: 65" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="drainageCondition">Drainage (0-10)</Label>
                  <Input id="drainageCondition" type="number" min="0" max="10" value={form.drainageCondition} onChange={(e) => setForm({...form, drainageCondition: Number(e.target.value)})} placeholder="Ex: 4" required />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Lancer l'Analyse</Button>
            </CardFooter>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="bg-slate-50">
            <CardHeader>
              <CardTitle className="text-slate-700">Résultat de Prédiction</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
              {result ? (
                <div className="text-center space-y-4">
                  <Badge variant={getBadgeVariant(result)} className="text-lg px-4 py-1">Risque {result}</Badge>
                  <p className="text-sm text-slate-500 max-w-sm mt-4">
                    Le modèle a analysé les paramètres. {result === 'High' ? "Une intervention préventive est recommandée immédiatement pour sécuriser la zone." : "La zone est actuellement dans un état gérable. Continuez le monitoring."}
                  </p>
                </div>
              ) : (
                <div className="text-center text-slate-400 flex flex-col items-center">
                  <Activity className="w-12 h-12 mb-4 opacity-50" />
                  <p>En attente des données environnementales pour la prédiction...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
