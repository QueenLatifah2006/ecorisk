import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from '@/src/components/ui/card';
import { supabase } from '@/src/lib/supabase';

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
  low: "#16a34a",
  medium: "#f59e0b",
  high: "#dc2626"
};

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function ActionMap() {
  const [zones, setZones] = useState<any[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      const { data } = await supabase.from('reports').select('*').in('status', ['validated', 'in_progress', 'resolved']);
      if (data) {
        setZones(data.map(r => ({
          id: r.id,
          name: r.title,
          lat: r.latitude,
          lng: r.longitude,
          risk: r.severity === 'high' ? 'Élevé' : r.severity === 'medium' ? 'Moyen' : 'Faible',
          type: r.category,
          color: CATEGORY_COLORS[r.category] || "#3b82f6",
          description: r.description
        })));
      }
    };
    if (supabase) fetchReports();
  }, []);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Carte Publique</h1>
        <p className="text-slate-500">Visualisation géographique en temps réel des signalements validés.</p>
      </div>

      <Card className="flex-1 min-h-[500px] overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="p-0 h-[500px] w-full">
           <MapContainer 
              center={zones.length > 0 ? [zones[zones.length - 1].lat, zones[zones.length - 1].lng] : [3.8480, 11.5021]} 
              zoom={13} 
              style={{ height: '100%', width: '100%', zIndex: 0 }}
           >
              <MapUpdater center={zones.length > 0 ? [zones[zones.length - 1].lat, zones[zones.length - 1].lng] : [3.8480, 11.5021]} />
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {zones.map(zone => (
                <CircleMarker
                  key={zone.id}
                  center={[zone.lat, zone.lng]}
                  radius={12}
                  pathOptions={{ 
                    color: zone.color, 
                    fillColor: zone.color, 
                    fillOpacity: 0.6,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div className="font-sans min-w-[150px]">
                      <h3 className="font-bold text-sm tracking-tight">{zone.name}</h3>
                      <p className="text-xs mt-1"><span className="font-medium text-slate-600">Gravité:</span> {zone.risk}</p>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-3">{zone.description}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
        </CardContent>
      </Card>
      
      <div className="flex gap-4 items-center justify-center text-sm flex-wrap">
        <p className="text-slate-500 mb-2 font-bold w-full text-center">Légende</p>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#f97316]"></div> Déchets / Pollution</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div> Eau / Inondation</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#eab308]"></div> Infrastructures</div>
      </div>
    </div>
  );
}
