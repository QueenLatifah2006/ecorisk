import React, { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Button } from '@/src/components/ui/button';
import { supabase } from '@/src/lib/supabase';
import { Megaphone, MapPin, Camera, AlertOctagon, CheckCircle2, MapPinned, UploadCloud, Trash2, Wind, Waves, Droplet, Wrench, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/src/lib/utils';

type ReportCategory = 
  | 'waste' 
  | 'pollution' 
  | 'blocked_drains' 
  | 'stagnant_water' 
  | 'broken_pipes' 
  | 'power_poles' 
  | 'unsanitary_zones' 
  | 'flood';

type SeverityLevel = 'low' | 'medium' | 'high';

const CATEGORIES: { id: ReportCategory, label: string, icon: any, colorClass: string }[] = [
  { id: 'waste', label: 'Déchets / Dépotoirs', icon: Trash2, colorClass: 'border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100' },
  { id: 'pollution', label: 'Odeurs / Pollution', icon: Wind, colorClass: 'border-stone-500 bg-stone-50 text-stone-700 hover:bg-stone-100' },
  { id: 'blocked_drains', label: 'Caniveaux Bouchés', icon: Waves, colorClass: 'border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100' },
  { id: 'stagnant_water', label: 'Eau Stagnante', icon: Droplet, colorClass: 'border-teal-500 bg-teal-50 text-teal-700 hover:bg-teal-100' },
  { id: 'broken_pipes', label: 'Tuyaux Cassés', icon: Wrench, colorClass: 'border-cyan-500 bg-cyan-50 text-cyan-700 hover:bg-cyan-100' },
  { id: 'power_poles', label: 'Poteaux Dangereux', icon: Zap, colorClass: 'border-yellow-500 bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
  { id: 'unsanitary_zones', label: 'Zones Insalubres', icon: AlertTriangle, colorClass: 'border-red-500 bg-red-50 text-red-700 hover:bg-red-100' },
  { id: 'flood', label: 'Inondation', icon: Megaphone, colorClass: 'border-blue-600 bg-blue-50 text-blue-800 hover:bg-blue-100' }
];

export function CitizenReportForm({ userId }: { userId?: string }) {
  const [reportType, setReportType] = useState<ReportCategory>('waste');
  const [severity, setSeverity] = useState<SeverityLevel>('medium');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  React.useEffect(() => {
    handleGetLocation();
  }, []);

  const handleGetLocation = (showErrors: boolean = false) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
            const data = await res.json();
            if (data && data.display_name) {
               setLocation(data.display_name);
               return;
            }
          } catch(e) {}
          setLocation(`Position GPS capturée (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
        },
        (error) => {
          console.error("Error getting location", error);
          if (showErrors) alert("Impossible de récupérer la position.");
        }
      );
    } else {
      if (showErrors) alert("La géolocalisation n'est pas supportée par ce navigateur.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoName(file.name);
      setIsAnalyzing(true);
      
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          setImageBase64(base64data);
          
          const response = await fetch('/api/analyze-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageBase64: base64data })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.category && data.severity) {
              setReportType(data.category);
              setSeverity(data.severity);
            }
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error analyzing image:", error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordinates) {
       alert("La géolocalisation est obligatoire pour soumettre un signalement.");
       return;
    }
    setIsSubmitting(true);
    
    setSubmitError(null);
    if (supabase) {
      try {
        const categoryLabel = CATEGORIES.find(c => c.id === reportType)?.label || reportType;
        const { error } = await supabase
          .from('reports')
          .insert([
            {
              id: crypto.randomUUID(),
              title: `Signalement: ${categoryLabel} à ${location}`,
              description: description,
              category: reportType,
              latitude: coordinates.lat,
              longitude: coordinates.lng,
              severity: severity,
              image_url: imageBase64,
              points_earned: 0,
              is_duplicate: false,
              user_id: userId || null,
              created_at: new Date().toISOString()
            }
          ]);
        
        if (error) {
          console.error("Error saving report to Supabase:", error);
          setSubmitError(error.message || "Erreur lors de l'envoi à Supabase");
          toast.error("Erreur lors de l'envoi : " + (error.message || "Erreur inconnue"));
        } else {
          toast.success("Votre signalement a été envoyé aux autorités locales avec succès. Merci !");
          resetForm();
        }
      } catch (err: any) {
        console.error("Failed to connect to Supabase:", err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Simulate submission if no supabase config
      setTimeout(() => {
        toast.success("Votre signalement a été envoyé aux autorités locales avec succès. Merci !");
        setIsSubmitting(false);
        resetForm();
      }, 1000);
    }
  };

  const resetForm = () => {
    setLocation('');
    setDescription('');
    setCoordinates(null);
    setPhotoName(null);
    setImageBase64(null);
    setSeverity('medium');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Signalement Citoyen</h1>
        <p className="text-slate-500">Signalez tout problème urbain ou environnemental dans votre quartier.</p>
      </div>

      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800 animate-in fade-in slide-in-from-top-4">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm font-medium">Erreur Supabase : {submitError}</p>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Nouveau Signalement</CardTitle>
            <CardDescription>Fournissez le plus de détails possible pour aider les équipes d'intervention.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Catégorie du problème <span className="text-red-500 ml-0.5">*</span></Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CATEGORIES.map((cat) => (
                   <button
                     key={cat.id}
                     type="button"
                     onClick={() => setReportType(cat.id)}
                     className={cn(
                       "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center gap-2",
                       reportType === cat.id 
                         ? cat.colorClass 
                         : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                     )}
                   >
                     <cat.icon className="w-6 h-6" />
                     <span className="font-semibold text-xs leading-tight">{cat.label}</span>
                   </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Niveau de gravité estimé <span className="text-red-500 ml-0.5">*</span></Label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                 <button type="button" onClick={() => setSeverity('low')} className={cn("flex-1 py-2 text-sm font-medium transition-all rounded-md", severity === 'low' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Faible (Mineur)</button>
                 <button type="button" onClick={() => setSeverity('medium')} className={cn("flex-1 py-2 text-sm font-medium transition-all rounded-md", severity === 'medium' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Moyen (Gênant)</button>
                 <button type="button" onClick={() => setSeverity('high')} className={cn("flex-1 py-2 text-sm font-medium transition-all rounded-md", severity === 'high' ? "bg-white text-red-600 shadow-sm border border-red-100" : "text-slate-500 hover:text-slate-700")}>Élevé (Urgent)</button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center justify-between">
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-500"/> Localisation Exacte <span className="text-red-500 ml-0.5">*</span></span>
                <button type="button" onClick={() => handleGetLocation(true)} className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline">
                  <MapPinned className="w-3 h-3" />
                  Me géolocaliser
                </button>
              </Label>
              <Input 
                id="location" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                placeholder="Géolocalisation automatique en cours..." 
                readOnly
                className="bg-slate-100 text-slate-600 font-medium cursor-not-allowed border-slate-200"
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2"> Description de la situation <span className="text-red-500 ml-0.5">*</span></Label>
              <textarea 
                id="description" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex w-full min-h-[80px] text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-colors placeholder:text-slate-500 resize-y"
                placeholder="Décrivez avec vos propres mots ce que vous observez..."
                required
              />
            </div>

            <div className="pt-1">
               <Label className="flex items-center gap-2 mb-2">Preuve Visuelle <span className="text-slate-400 font-normal lowercase">(Optionnel mais recommandé)</span></Label>
               <div className="relative">
                  <input 
                    type="file" 
                    id="photo" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className={cn(
                    "flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl transition-colors",
                    photoName ? "border-green-400 bg-green-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                  )}>
                     {isAnalyzing ? (
                       <div className="text-center">
                         <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                         <span className="text-sm font-medium text-green-700">Traitement de l'image...</span>
                       </div>
                     ) : photoName ? (
                       <div className="text-center">
                         <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-1" />
                         <span className="text-sm font-medium text-green-700">{photoName} ajouté</span>
                       </div>
                     ) : (
                       <div className="text-center">
                         <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                         <span className="text-sm font-medium text-slate-600">Ajouter une photo</span>
                       </div>
                     )}
                  </div>
               </div>
            </div>

          </CardContent>
          <CardFooter className="bg-slate-50 border-t border-slate-100 mt-6 pt-6 rounded-b-2xl">
            <Button type="submit" disabled={isSubmitting || !coordinates} className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Envoi en cours...' : !coordinates ? 'Géolocalisation requise' : 'Soumettre le signalement'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
