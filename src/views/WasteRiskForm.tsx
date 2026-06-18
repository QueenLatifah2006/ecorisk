import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { predictWasteRisk } from '@/src/lib/ml';
import { WasteRiskInput, RiskLevel } from '@/src/types';
import { MapPin, Users, History, TestTube, Factory } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

export function WasteRiskForm() {
  const [form, setForm] = useState<WasteRiskInput>({
    populationDensity: 0,
    collectionFrequency: 1,
    distanceToMarket: 0,
    previousReports: 0,
    rainySeason: false,
  });

  const [result, setResult] = useState<RiskLevel | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prediction = predictWasteRisk(form);
    setResult(prediction);
    
    if (supabase) {
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('waste_predictions')
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
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Waste Risk Assessment</h1>
        <p className="text-slate-500">Identifiez les zones susceptibles d'accumuler des déchets dangereux.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Facteurs de Risque</CardTitle>
              <CardDescription>Métriques démographiques et logistiques.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="density" className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-500"/> Densité de Population</Label>
                <Input id="density" type="number" value={form.populationDensity} onChange={(e) => setForm({...form, populationDensity: Number(e.target.value)})} placeholder="Par km² (Ex: 5000)" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency" className="flex items-center gap-2"><Factory className="w-4 h-4 text-slate-500"/> Fréquence de Collecte</Label>
                <Input id="frequency" type="number" value={form.collectionFrequency} onChange={(e) => setForm({...form, collectionFrequency: Number(e.target.value)})} placeholder="Par semaine (Ex: 2)" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="market" className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-500"/> Distance d'un marché (km)</Label>
                <Input id="market" type="number" step="0.1" value={form.distanceToMarket} onChange={(e) => setForm({...form, distanceToMarket: Number(e.target.value)})} placeholder="Ex: 0.5" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reports" className="flex items-center gap-2"><History className="w-4 h-4 text-slate-500"/> Signalements Précédents</Label>
                <Input id="reports" type="number" value={form.previousReports} onChange={(e) => setForm({...form, previousReports: Number(e.target.value)})} placeholder="Mois dernier (Ex: 5)" required />
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                 <input 
                    type="checkbox" 
                    id="rainy" 
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                    checked={form.rainySeason}
                    onChange={(e) => setForm({...form, rainySeason: e.target.checked})}
                 />
                 <Label htmlFor="rainy">Saison des pluies en cours</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Calculer le Score</Button>
            </CardFooter>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="bg-slate-50">
            <CardHeader>
              <CardTitle className="text-slate-700">Alerte Déchets</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
              {result ? (
                <div className="text-center space-y-4">
                  <Badge variant={getBadgeVariant(result)} className="text-lg px-4 py-1">Risque {result}</Badge>
                  <p className="text-sm text-slate-500 max-w-sm mt-4">
                    {result === 'High' 
                      ? "Score critique. L'accumulation de déchets obstrue potentiellement les évacuations. Déployer une équipe d'assainissement." 
                      : "La fréquence de collecte actuelle maintient le risque à un niveau tolérable."}
                  </p>
                </div>
              ) : (
                <div className="text-center text-slate-400 flex flex-col items-center">
                  <TestTube className="w-12 h-12 mb-4 opacity-50" />
                  <p>Fournissez les paramètres de la zone pour évaluer le risque de congestion par les déchets.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
