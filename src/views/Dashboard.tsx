import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Map, AlertTriangle, Activity, MapPin, Plus } from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { supabase } from '@/src/lib/supabase';

export function Dashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [monitoredZones, setMonitoredZones] = useState<string[]>([]);
  const [newZone, setNewZone] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      const { data } = await supabase.from('reports').select('*');
      if (data) setReports(data);
    };
    if (supabase) fetchReports();

    const savedZones = localStorage.getItem('ecorisk_monitored_zones');
    if (savedZones) {
      setMonitoredZones(JSON.parse(savedZones));
    }
  }, []);

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (newZone.trim() && !monitoredZones.includes(newZone.trim())) {
      const updated = [...monitoredZones, newZone.trim()];
      setMonitoredZones(updated);
      localStorage.setItem('ecorisk_monitored_zones', JSON.stringify(updated));
      setNewZone('');
    }
  };

  const handleRemoveZone = (zone: string) => {
    const updated = monitoredZones.filter(z => z !== zone);
    setMonitoredZones(updated);
    localStorage.setItem('ecorisk_monitored_zones', JSON.stringify(updated));
  };

  // Calculations
  const zonesCount = monitoredZones.length;
  
  const avgRisk = reports.length > 0 
    ? (reports.reduce((acc, r) => acc + (r.severity === 'high' ? 80 : r.severity === 'medium' ? 50 : 20), 0) / reports.length).toFixed(0) 
    : 0;

  const activeFloodAlerts = reports.filter(r => r.category === 'flood' && r.status !== 'resolved');
  const floodAlertsCount = activeFloodAlerts.length;

  const coverage = reports.length > 0 
    ? ((reports.filter(r => r.status === 'resolved').length / reports.length) * 100).toFixed(0) 
    : 0;

  const graphData = monitoredZones.map(zone => {
    const zoneReports = reports.filter(r => (r.title || '').toLowerCase().includes(zone.toLowerCase()));
    const floodRisk = zoneReports.filter(r => r.category === 'flood').reduce((acc, r) => acc + (r.severity === 'high' ? 5 : r.severity === 'medium' ? 3 : 1), 0) * 10;
    const wasteRisk = zoneReports.filter(r => r.category === 'waste' || r.category === 'pollution').reduce((acc, r) => acc + (r.severity === 'high' ? 5 : r.severity === 'medium' ? 3 : 1), 0) * 10;
    return { name: zone, floodRisk, wasteRisk };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Aperçu en temps réel des risques environnementaux.</p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-slate-50 rounded-lg text-slate-600">
              <MapPin className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold text-slate-400">MÉTRIQUE</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-600">Zones Surveillées</h3>
          <p className="text-3xl font-bold text-slate-800">{zonesCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Activity className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold text-slate-400">SCORE ÉCO</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-600">Risque Moyen</h3>
          <p className="text-3xl font-bold text-slate-800">{avgRisk} <span className="text-lg font-normal text-slate-400">/100</span></p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-red-50 rounded-lg text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold text-slate-400">INONDATION</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-600">Alertes Actives</h3>
          <p className="text-3xl font-bold text-red-600">{floodAlertsCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-green-50 rounded-lg text-green-600">
              <Map className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold text-slate-400">RÉSOLUTIONS</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-600">Taux de Résolution</h3>
          <p className="text-3xl font-bold text-slate-800">{coverage} <span className="text-lg font-normal text-slate-400">%</span></p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Graph */}
        <Card className="col-span-4 flex flex-col">
          <CardHeader>
            <CardTitle>Analyse des Risques par Zone Surveillée</CardTitle>
            <CardDescription>
              Comparaison des scores de risque d'inondation et d'accumulation de déchets dans les zones suivies.
            </CardDescription>
            <form onSubmit={handleAddZone} className="flex gap-2 mt-4">
               <Input 
                 placeholder="Ajouter une zone (ex: Mvog-Beti)" 
                 value={newZone} 
                 onChange={e => setNewZone(e.target.value)} 
                 className="max-w-xs"
               />
               <Button type="submit" variant="secondary" size="sm" className="shrink-0">
                 <Plus className="w-4 h-4 mr-1" /> Ajouter
               </Button>
            </form>
            <div className="flex flex-wrap gap-2 mt-3">
               {monitoredZones.map(zone => (
                 <Badge key={zone} variant="outline" className="bg-slate-50 cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors" onClick={() => handleRemoveZone(zone)} title="Cliquer pour retirer">
                   {zone}
                 </Badge>
               ))}
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            {graphData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Legend />
                  <Bar dataKey="floodRisk" name="Risque Inondation" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="wasteRisk" name="Risque Déchets" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500 italic border-2 border-dashed border-slate-100 rounded-xl">
                Ajoutez une zone ci-dessus pour générer le graphique.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Flood Alerts */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Alertes Inondation Actives</CardTitle>
            <CardDescription>
              Zones signalées à risque d'inondation nécessitant une attention immédiate.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {activeFloodAlerts.length === 0 ? (
               <div className="p-8 text-center text-slate-500 text-sm">
                 Aucune alerte inondation active pour le moment.
               </div>
             ) : (
               <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                 {activeFloodAlerts.slice(0, 5).map(alert => (
                   <div key={alert.id} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                     <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                     <div>
                       <div className="flex items-center gap-2 mb-1">
                         <span className="text-sm font-bold text-red-900 line-clamp-1">{alert.title}</span>
                         <Badge className="bg-red-600 text-[10px] uppercase shrink-0">{alert.severity}</Badge>
                       </div>
                       <p className="text-[10px] font-medium text-red-400">
                         Statut: {alert.status === 'validated' ? 'Validé (En attente)' : alert.status === 'in_progress' ? 'En cours d\'intervention' : 'En attente'}
                       </p>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
