import React, { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertOctagon, Megaphone, Search, RadioTower, CheckCircle2, Trash2, Wind, Waves, Droplet, Wrench, Zap, AlertTriangle, Filter, BarChart3, X, MapPin, User, Clock } from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import { supabase } from '@/src/lib/supabase';

// Extended mock data integrating AI Predictions and User Reports
const adminMapData: any[] = [];

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

const CATEGORY_LABELS: Record<string, string> = {
  waste: "Déchets",
  pollution: "Pollution",
  blocked_drains: "Caniveaux",
  stagnant_water: "Eau stagnante",
  broken_pipes: "Tuyaux",
  power_poles: "Poteaux",
  unsanitary_zones: "Insalubrité",
  flood: "Inondation"
};

const CATEGORY_COLORS: Record<string, string> = {
  waste: "#f97316", // orange
  pollution: "#f97316", 
  blocked_drains: "#3b82f6", // blue
  stagnant_water: "#3b82f6", 
  flood: "#3b82f6",
  broken_pipes: "#eab308", // yellow
  power_poles: "#eab308",
  unsanitary_zones: "#a8a29e" // gray
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  medium: "bg-orange-100 text-orange-700 border-orange-200",
  high: "bg-red-100 text-red-700 border-red-200"
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'waste': return <Trash2 className="w-4 h-4" />;
    case 'pollution': return <Wind className="w-4 h-4" />;
    case 'blocked_drains': return <Waves className="w-4 h-4" />;
    case 'stagnant_water': return <Droplet className="w-4 h-4" />;
    case 'broken_pipes': return <Wrench className="w-4 h-4" />;
    case 'power_poles': return <Zap className="w-4 h-4" />;
    case 'unsanitary_zones': return <AlertTriangle className="w-4 h-4" />;
    case 'flood': return <Megaphone className="w-4 h-4" />;
    default: return <AlertOctagon className="w-4 h-4" />;
  }
};

export interface AlertMessage {
  id: string;
  title: string;
  message: string;
}

interface AdminDashboardProps {
  onBroadcastAlert?: (alert: AlertMessage) => void;
}

export function AdminDashboard({ onBroadcastAlert }: AdminDashboardProps) {
  const [broadcastedIds, setBroadcastedIds] = useState<(string | number)[]>([]);
  const [mapData, setMapData] = useState<any[]>(adminMapData);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<string | number | null>(null);

  React.useEffect(() => {
    const fetchReports = async () => {
      const { data } = await supabase.from('reports').select('*, users(username)');
      if (data) {
        const formattedReports = data.map((r: any) => ({
          id: r.id,
          type: 'USER_REPORT',
          category: r.category,
          name: r.title,
          lat: r.latitude,
          lng: r.longitude,
          status: r.status || 'pending',
          user: r.users?.username || 'Anonyme',
          user_id: r.user_id,
          color: CATEGORY_COLORS[r.category] || '#3b82f6',
          severity: r.severity,
          description: r.description,
          imageUrl: r.image_url,
          date: r.created_at
        }));
        setMapData([...adminMapData, ...formattedReports]);
      }
    };
    if (supabase) fetchReports();
  }, []);

  const selectedReport = mapData.find(item => item.id === selectedReportId);

  const filteredData = mapData.filter(item => {
    const matchType = filterType === 'all' || item.category === filterType;
    const matchSeverity = filterSeverity === 'all' || item.severity === filterSeverity;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        CATEGORY_LABELS[item.category]?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSeverity && matchSearch;
  });

  const handleValidateReport = async (id: string | number, userId: string, severity: string) => {
    const { error } = await supabase.from('reports').update({ status: 'validated' }).eq('id', id);
    if (error) {
      toast.error("Erreur de validation"); return;
    }
    let pts = 5; if (severity === 'medium') pts = 10; if (severity === 'high') pts = 20;
    if (userId) {
       const { data } = await supabase.from('users').select('points').eq('id', userId).single();
       if (data) await supabase.from('users').update({ points: data.points + pts }).eq('id', userId);
    }
    toast.success(`Signalement validé ! (+${pts} points attribués)`);
    setMapData(prev => prev.map(item => item.id === id ? { ...item, status: 'validated' } : item));
    setSelectedReportId(null);
  };

  const handleRejectReport = async (id: string | number) => {
    const { error } = await supabase.from('reports').update({ status: 'rejected' }).eq('id', id);
    if (!error) {
      toast.success("Signalement rejeté.");
      setMapData(prev => prev.map(item => item.id === id ? { ...item, status: 'rejected' } : item));
      setSelectedReportId(null);
    }
  };

  const handleUpdateStatus = async (id: string | number, newStatus: string) => {
    const { error } = await supabase.from('reports').update({ status: newStatus }).eq('id', id);
    if (!error) {
      toast.success("Statut mis à jour.");
      setMapData(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    }
  };

  const handleBroadcast = (pred: any) => {
    if (!broadcastedIds.includes(pred.id)) {
      setBroadcastedIds([...broadcastedIds, pred.id]);
      if (onBroadcastAlert) {
        onBroadcastAlert({
          id: pred.id.toString(),
          title: `Alerte Inondation (Risque ${pred.severity === 'high' ? 'Élevé' : 'Moyen'})`,
          message: `Une inondation est prévue dans la zone de ${pred.name}. Prudence requise.`
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Centre de Contrôle Administrateur</h1>
        <p className="text-slate-500">Supervision globale des inférences IA et des signalements citoyens.</p>
      </div>

      {/* Interactive Map Section */}
      <Card className="min-h-[400px] overflow-hidden rounded-2xl border-slate-200 shadow-sm relative">
        <div className="absolute top-4 left-4 z-[1000] bg-white p-2 rounded-lg shadow-md border border-slate-200 space-y-2 text-xs font-medium w-48">
          <p className="text-slate-500 mb-2 font-bold">Légende Carte</p>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#f97316]"></div> Déchets / Pollution</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div> Eau / Inondation</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#eab308]"></div> Infrastructures</div>
        </div>
        <CardContent className="p-0 h-[400px] w-full">
           <MapContainer 
              center={filteredData.length > 0 ? [filteredData[filteredData.length - 1].lat, filteredData[filteredData.length - 1].lng] : [3.8480, 11.5021]} 
              zoom={13} 
              style={{ height: '100%', width: '100%', zIndex: 0 }}
           >
              <MapUpdater center={filteredData.length > 0 ? [filteredData[filteredData.length - 1].lat, filteredData[filteredData.length - 1].lng] : [3.8480, 11.5021]} />
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {filteredData.map(zone => (
                <CircleMarker
                  key={zone.id}
                  center={[zone.lat, zone.lng]}
                  radius={zone.type === 'AI_PREDICTION' ? 14 : 10}
                  pathOptions={{ 
                    color: zone.color, 
                    fillColor: zone.color, 
                    fillOpacity: zone.type === 'AI_PREDICTION' ? 0.4 : 0.8,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div className="font-sans min-w-[200px]">
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant={zone.type === 'AI_PREDICTION' ? 'default' : 'outline'} className="text-[10px] uppercase">
                          {zone.type === 'AI_PREDICTION' ? 'IA Prédiction' : 'Signalement Citoyen'}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                        {getCategoryIcon(zone.category)} {zone.name}
                      </h3>
                      <div className="text-xs mt-2 text-slate-600">
                        {zone.type === 'AI_PREDICTION' ? (
                           <>
                             <span className="block mb-1"><strong>Type:</strong> Risque {CATEGORY_LABELS[zone.category]}</span>
                             <Badge variant="outline" className={`text-[10px] ${SEVERITY_COLORS[zone.severity]}`}>
                               Gravité {zone.severity}
                             </Badge>
                             <span className="block mt-1">Confiance: {zone.confidence}</span>
                           </>
                        ) : (
                           <>
                             <span className="block mb-1"><strong>Problème:</strong> {CATEGORY_LABELS[zone.category]}</span>
                             <Badge variant="outline" className={`text-[10px] ${SEVERITY_COLORS[zone.severity]}`}>
                               Gravité {zone.severity}
                             </Badge>
                             <span className="block mt-1"><strong>Statut:</strong> {zone.status}</span>
                             <span className="block text-slate-400 mt-1">Par: {zone.user}</span>
                           </>
                        )}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* User Reports Queue - Takes 2 cols on lg screens */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <CardTitle className="text-lg">Signalements Citoyens</CardTitle>
              <CardDescription>Liste détaillée des problèmes urgents.</CardDescription>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
               {/* Filters */}
               <div className="relative w-full sm:w-48">
                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                 <Input 
                   placeholder="Rechercher quartier..." 
                   className="pl-8 h-9 text-xs w-full"
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                 />
               </div>
               
               <select 
                 className="text-xs h-9 px-2 rounded-md border border-slate-200 bg-white"
                 value={filterType}
                 onChange={e => setFilterType(e.target.value)}
               >
                 <option value="all">Tous les types</option>
                 <option value="waste">Déchets</option>
                 <option value="pollution">Pollution</option>
                 <option value="blocked_drains">Caniveaux</option>
                 <option value="power_poles">Poteaux électriques</option>
               </select>

               <select 
                 className="text-xs h-9 px-2 rounded-md border border-slate-200 bg-white"
                 value={filterSeverity}
                 onChange={e => setFilterSeverity(e.target.value)}
               >
                 <option value="all">Toutes gravités</option>
                 <option value="low">Faible</option>
                 <option value="medium">Moyenne</option>
                 <option value="high">Élevée</option>
               </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {filteredData.filter(d => d.type === 'USER_REPORT').length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Aucun signalement ne correspond à vos filtres.
                </div>
              )}
              {filteredData.filter(d => d.type === 'USER_REPORT').map(report => (
                <div key={report.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors gap-4">
                  <div className="flex gap-4">
                    <div className={`mt-1 p-2.5 rounded-xl shrink-0 h-fit ${
                       report.status === 'rejected' ? 'bg-red-100 text-red-600' :
                       (report.status === 'validated' || report.status === 'in_progress' || report.status === 'resolved') ? 'bg-green-100 text-green-600' :
                       'bg-blue-100 text-blue-600'
                    }`}>
                      {getCategoryIcon(report.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{report.name}</p>
                        <Badge variant="outline" className={`text-[9px] uppercase tracking-wider ${SEVERITY_COLORS[report.severity || 'low']}`}>
                          {report.severity}
                        </Badge>
                      </div>
                      <p className="text-xs font-medium text-slate-700 mb-1">{CATEGORY_LABELS[report.category]}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span>Status: <span className="font-medium text-slate-700">{report.status}</span></span>
                        <span>•</span>
                        <span>Signalé par: {report.user}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="font-semibold text-xs shrink-0 transition-colors text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                    onClick={() => setSelectedReportId(report.id)}
                  >
                    Examiner
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        
      </div>

      {/* Analytics: Risk by Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Scores de Risque par Zone
          </CardTitle>
          <CardDescription>Calculé en fonction de la fréquence et de la gravité des incidents ou prédictions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(
              mapData.reduce((acc: any, curr) => {
                const zone = curr.name;
                if (!acc[zone]) acc[zone] = 0;
                let multiplier = 1;
                if (curr.severity === 'high') multiplier = 5;
                if (curr.severity === 'medium') multiplier = 3;
                if (curr.type === 'AI_PREDICTION') multiplier += 5; // AI carries more weight
                acc[zone] += multiplier;
                return acc;
              }, {})
            ).sort((a: any, b: any) => b[1] - a[1]).map(([zone, score]: any) => (
              <div key={zone} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between">
                <p className="font-semibold text-slate-800 text-sm mb-2">{zone}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Score</span>
                    <span className={`text-lg font-black ${score >= 10 ? 'text-red-600' : score >= 5 ? 'text-orange-600' : 'text-slate-700'}`}>{score}</span>
                  </div>
                  <Badge variant="outline" className={score >= 10 ? 'bg-red-100 text-red-700 border-red-200' : score >= 5 ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-slate-200 text-slate-700 border-slate-300'}>
                    {score >= 10 ? 'Critique' : score >= 5 ? 'Élevé' : 'Modéré'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-200 text-slate-700 rounded-lg">
                  {getCategoryIcon(selectedReport.category)}
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">{CATEGORY_LABELS[selectedReport.category]} - {selectedReport.name}</h2>
                  <p className="text-xs text-slate-500">ID: #{selectedReport.id} • Signalement Citoyen</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedReportId(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Auteur</p>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <User className="w-4 h-4 text-slate-400" />
                      {selectedReport.user}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Date & Heure</p>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {selectedReport.date ? new Date(selectedReport.date).toLocaleString('fr-FR') : 'Non spécifié'}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                   <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Localisation GPS</p>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {selectedReport.lat.toFixed(4)}, {selectedReport.lng.toFixed(4)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Niveau de gravité</p>
                    <Badge variant="outline" className={`mt-1 uppercase tracking-wider text-[10px] ${SEVERITY_COLORS[selectedReport.severity || 'low']}`}>
                      {selectedReport.severity}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description du problème</p>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedReport.description || "Aucune description fournie par l'utilisateur."}
                </div>
              </div>

              {selectedReport.imageUrl && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Preuve Visuelle</p>
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <img src={selectedReport.imageUrl} alt="Preuve" className="w-full h-auto max-h-[300px] object-cover" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-4 shrink-0">
               <div className="flex items-center gap-2">
                 <span className="text-sm font-medium text-slate-600">Statut actuel:</span>
                   <Badge className={
                      selectedReport.status === 'validated' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                      selectedReport.status === 'in_progress' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' :
                      selectedReport.status === 'resolved' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                      selectedReport.status === 'rejected' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                      'bg-slate-200 text-slate-800 hover:bg-slate-200'
                   }>
                     {selectedReport.status === 'validated' ? 'Validé' : 
                      selectedReport.status === 'in_progress' ? 'En cours' : 
                      selectedReport.status === 'resolved' ? 'Résolu' : 
                      selectedReport.status === 'rejected' ? 'Rejeté' : 'En Attente'}
                   </Badge>
               </div>
               <div className="flex gap-2">
                  {selectedReport.type === 'USER_REPORT' && selectedReport.status === 'pending' && (
                    <>
                      <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleValidateReport(selectedReport.id, selectedReport.user_id, selectedReport.severity)}>
                        Valider
                      </Button>
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleRejectReport(selectedReport.id)}>
                        Rejeter
                      </Button>
                    </>
                  )}
                  {selectedReport.type === 'USER_REPORT' && selectedReport.status !== 'pending' && selectedReport.status !== 'rejected' && (
                     <select 
                       className="text-sm h-9 px-3 rounded-md border border-slate-200 bg-white shadow-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                       value={selectedReport.status}
                       onChange={(e) => handleUpdateStatus(selectedReport.id, e.target.value)}
                     >
                       <option value="validated">Validé (En attente d'action)</option>
                       <option value="in_progress">En cours de résolution</option>
                       <option value="resolved">Résolu</option>
                     </select>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
