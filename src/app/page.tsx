"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Dashboard } from '@/src/views/Dashboard';
import { PredictionForm } from '@/src/views/PredictionForm';
import { WasteRiskForm } from '@/src/views/WasteRiskForm';
import dynamic from 'next/dynamic';
const ActionMap = dynamic(() => import('@/src/views/ActionMap').then(mod => mod.ActionMap), { ssr: false });
import { CitizenReportForm } from '@/src/views/CitizenReportForm';
const AdminDashboard = dynamic(() => import('@/src/views/AdminDashboard').then(mod => mod.AdminDashboard), { ssr: false });
import type { AlertMessage } from '@/src/views/AdminDashboard';
import { Auth, User } from '@/src/views/Auth';
import { ShieldAlert, BarChart3, Droplets, Trash2, MapPinned, Megaphone, LogOut, Shield, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';

type ViewState = 'dashboard' | 'flood' | 'waste' | 'map' | 'report' | 'admin-dash';
type UserRole = 'admin' | 'citizen' | null;

export default function App() {
  const [activeView, setActiveView] = useState<ViewState>('report');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<AlertMessage[]>([]);
  const [userStats, setUserStats] = useState({ validated: 0, points: 0 });

  useEffect(() => {
    if (currentUser && currentUser.role === 'citizen') {
      // Fetch points from users table
      const fetchStats = async () => {
        const { data: userData } = await supabase.from('users').select('points').eq('id', currentUser.id).single();
        // Fetch count of validated reports
        const { count } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id).eq('status', 'validated');
        
        setUserStats({
          points: userData?.points || currentUser.points || 0,
          validated: count || 0
        });
      };
      fetchStats();
    }
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setActiveView('admin-dash');
    } else {
      setActiveView('report');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleBroadcastAlert = (alert: AlertMessage) => {
    // Only add if it doesn't already exist
    if (!activeAlerts.find(a => a.id === alert.id)) {
      setActiveAlerts(prev => [...prev, alert]);
    }
  };

  const removeAlert = (id: string) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="w-full h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 w-48">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isAdmin ? "bg-slate-900" : "bg-green-600")}>
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">EcoRisk</h1>
            <p className="text-[10px] uppercase tracking-widest text-blue-600 font-semibold">Prévenir. Protéger. Agir.</p>
          </div>
        </div>

        <div className="hidden md:flex items-center justify-center flex-1 gap-6">
          <nav className="flex gap-4 text-sm font-medium text-slate-500">
            {isAdmin ? (
              <>
                <button onClick={() => setActiveView('admin-dash')} className={cn("pb-1 transition-colors whitespace-nowrap", activeView === 'admin-dash' ? "text-slate-900 border-b-2 border-slate-900" : "hover:text-slate-800")}>Centre de Contrôle</button>
                <button onClick={() => setActiveView('dashboard')} className={cn("pb-1 transition-colors whitespace-nowrap", activeView === 'dashboard' ? "text-slate-900 border-b-2 border-slate-900" : "hover:text-slate-800")}>Métriques Globales</button>
              </>
            ) : (
              <>
                <button onClick={() => setActiveView('report')} className={cn("pb-1 transition-colors whitespace-nowrap", activeView === 'report' ? "text-green-600 border-b-2 border-green-600" : "hover:text-slate-800")}>Signaler un Délit</button>
                <button onClick={() => setActiveView('map')} className={cn("pb-1 transition-colors whitespace-nowrap", activeView === 'map' ? "text-green-600 border-b-2 border-green-600" : "hover:text-slate-800")}>Carte Publique</button>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4 w-48 justify-end">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 overflow-hidden flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
               {isAdmin ? 'AD' : currentUser.username.substring(0, 2)}
             </div>
             <div className="hidden lg:flex flex-col">
               <span className="text-xs text-slate-900 font-bold leading-none">{currentUser.username}</span>
               <span className="text-[10px] text-slate-500 font-medium">{isAdmin ? 'Administrateur' : `${userStats.points} Points`}</span>
             </div>
           </div>
           <button onClick={handleLogout} className="text-slate-400 hover:text-slate-900 transition-colors" title="Déconnexion">
             <LogOut className="w-5 h-5" />
           </button>
        </div>
      </header>

      {/* Global Alert Banners for Citizens */}
      {!isAdmin && activeAlerts.length > 0 && (
        <div className="w-full flex flex-col shrink-0">
          {activeAlerts.map(alert => (
            <div key={alert.id} className="bg-red-600 text-white px-6 py-3 flex items-start sm:items-center justify-between animate-in slide-in-from-top-2 shadow-sm border-b border-red-700 z-50">
              <div className="flex items-start sm:items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 sm:mt-0 text-red-100" />
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-sm">
                  <span className="font-bold tracking-wide uppercase text-red-50">{alert.title}</span>
                  <span className="opacity-100 font-medium">{alert.message}</span>
                </div>
              </div>
              <button onClick={() => removeAlert(alert.id)} className="shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors ml-4">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-200 bg-white p-5 flex flex-col gap-6 shrink-0 hidden lg:flex">
          {isAdmin ? (
            <div>
               <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Statut Système</h2>
               <div className="grid grid-cols-1 gap-3 mb-6">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3">
                     <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600"><Shield className="w-4 h-4"/></div>
                     <div>
                       <p className="text-xs text-slate-500">Serveur Principal</p>
                       <p className="text-sm font-bold text-slate-800">En Ligne</p>
                     </div>
                  </div>
               </div>
            </div>
          ) : (
            <div>
               <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Votre Impact</h2>
               <div className="grid grid-cols-1 gap-3">
                   <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                     <div>
                       <p className="text-xs text-slate-500">Signalements Validés</p>
                       <p className="text-2xl font-bold text-green-600">{userStats.validated}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-xs text-slate-500">Points Gagnés</p>
                       <p className="text-xl font-bold text-blue-600">+{userStats.points}</p>
                     </div>
                  </div>
               </div>
            </div>
          )}

          <div className="mt-auto flex flex-col gap-3">
            {!isAdmin && (
               <button
                 onClick={() => setActiveView('report')}
                 className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-colors"
               >
                 <Megaphone className="w-4 h-4" />
                 Signaler un délit
               </button>
            )}
            <div className={cn("p-4 rounded-xl border", isAdmin ? "bg-slate-50 border-slate-200" : "bg-blue-50 border-blue-100")}>
              <p className={cn("text-xs font-medium mb-1", isAdmin ? "text-slate-800" : "text-blue-800")}>EcoRisk</p>
              <p className={cn("text-[11px] leading-relaxed italic", isAdmin ? "text-slate-500" : "text-blue-600")}>"Plateforme communautaire de gestion des risques environnementaux."</p>
            </div>
          </div>
        </aside>

        {/* Dynamic Canvas */}
        <section className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto pb-24 md:pb-6 relative z-10">
          <div className="mx-auto max-w-6xl w-full">
            {activeView === 'dashboard' && <Dashboard />}
            {activeView === 'flood' && <PredictionForm />}
            {activeView === 'waste' && <WasteRiskForm />}
            {activeView === 'map' && <ActionMap />}
            {activeView === 'report' && <CitizenReportForm userId={currentUser.id} />}
            {activeView === 'admin-dash' && <AdminDashboard onBroadcastAlert={handleBroadcastAlert} />}
          </div>
        </section>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around h-16 px-2 pb-safe z-50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        {isAdmin ? (
          <>
            <button onClick={() => setActiveView('admin-dash')} className={cn("flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors", activeView === 'admin-dash' ? "text-slate-900" : "text-slate-400 hover:text-slate-600")}>
              <ShieldAlert className="w-5 h-5" />
              <span className="text-[10px] font-bold">Contrôle</span>
            </button>
            <button onClick={() => setActiveView('dashboard')} className={cn("flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors", activeView === 'dashboard' ? "text-slate-900" : "text-slate-400 hover:text-slate-600")}>
              <BarChart3 className="w-5 h-5" />
              <span className="text-[10px] font-bold">Stats</span>
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setActiveView('report')} className={cn("flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors", activeView === 'report' ? "text-green-600" : "text-slate-400 hover:text-slate-600")}>
              <Megaphone className="w-5 h-5" />
              <span className="text-[10px] font-bold">Signaler</span>
            </button>
            <button onClick={() => setActiveView('map')} className={cn("flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors", activeView === 'map' ? "text-green-600" : "text-slate-400 hover:text-slate-600")}>
              <MapPinned className="w-5 h-5" />
              <span className="text-[10px] font-bold">Carte</span>
            </button>
          </>
        )}
      </nav>

      <footer className="h-10 bg-white border-t border-slate-200 px-6 hidden md:flex items-center justify-between text-[11px] text-slate-400 shrink-0 font-medium">
        <div className="flex gap-4">
          <span>Vercel Deploy: Ready</span>
          <span>Auth: {isAdmin ? 'Admin' : 'Citizen'} Session</span>
        </div>
        <div>© 2024 EcoRisk - ODC Hackathon Build</div>
      </footer>
    </div>
  );
}
