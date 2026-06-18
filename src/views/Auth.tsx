import React, { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Button } from '@/src/components/ui/button';
import { Trees, User, Lock, Mail } from 'lucide-react';

import { supabase } from '@/src/lib/supabase';

type AuthMode = 'login' | 'register';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'citizen';
  points: number;
  created_at: string;
}

interface AuthProps {
  onLogin: (user: User) => void;
}

export function Auth({ onLogin }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast.error("Connexion à la base de données impossible.");
      return;
    }
    
    setIsLoading(true);
    
    if (mode === 'login') {
      const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
      if (error || !data) {
        toast.error("Aucun compte trouvé avec cet email (Avez-vous bien exécuté le script SQL ?).");
      } else if (data.password !== password) {
        toast.error("Mot de passe incorrect.");
      } else {
        toast.success(data.role === 'admin' ? "Bienvenue dans le Centre de Contrôle !" : "Connexion réussie !");
        onLogin(data as User);
      }
    } else {
      const { data, error } = await supabase.from('users').insert([{
        username: name,
        email: email,
        password: password,
        role: 'citizen',
        points: 0
      }]).select().single();
      
      if (error) {
        toast.error("Erreur d'inscription : " + error.message);
      } else if (data) {
        toast.success("Compte créé avec succès !");
        onLogin(data as User);
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Trees className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">EcoRisk AI</h1>
          <p className="text-sm font-medium text-slate-500 mt-2">Predict. Prevent. Protect.</p>
        </div>

        <Card className="border-slate-200 shadow-xl rounded-2xl overflow-hidden">
          <form onSubmit={handleSubmit}>
            <CardHeader className="bg-white pb-4 border-b border-slate-100">
              <CardTitle className="text-xl">{mode === 'login' ? 'Connexion' : 'Créer un compte'}</CardTitle>
              <CardDescription>
                {mode === 'login' 
                  ? 'Accédez à votre espace citoyen ou administrateur.' 
                  : 'Rejoignez la communauté pour signaler les risques environnementaux.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6 bg-slate-50">
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nom complet <span className="text-red-500 ml-0.5">*</span></Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input id="name" placeholder="Ex: Jean Dupont" className="pl-9 h-11 bg-white" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                 <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adresse Email <span className="text-red-500 ml-0.5">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="citoyen@example.com ou admin@ecorisk.com" 
                    className="pl-9 h-11 bg-white" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mot de passe <span className="text-red-500 ml-0.5">*</span></Label>
                  {mode === 'login' && <span className="text-xs font-medium text-blue-600 hover:underline cursor-pointer">Oublié ?</span>}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    className="pl-9 h-11 bg-white" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 bg-slate-50 pb-6">
              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11 text-sm font-bold shadow-md">
                {mode === 'login' ? 'Se connecter' : 'S\'inscrire gratuitement'}
              </Button>
              <button 
                type="button" 
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors"
              >
                {mode === 'login' 
                  ? 'Pas encore de compte ? S\'inscrire' 
                  : 'Déjà un compte ? Se connecter'}
              </button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="text-center bg-blue-50 border border-blue-100 p-4 rounded-xl">
           <p className="text-xs text-blue-800 font-medium uppercase tracking-wider mb-1">Authentification Demo</p>
           <p className="text-xs text-blue-600">Utilisez un email contenant <strong>admin</strong> pour accéder au Centre de Contrôle. Tout autre email ouvre l'interface Citoyen.</p>
        </div>
      </div>
    </div>
  );
}
