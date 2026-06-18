import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load variables from .env
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Les clés Supabase sont introuvables dans le fichier .env.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkConnection() {
  console.log("Connexion à Supabase avec l'URL :", supabaseUrl);
  
  // Test de lecture sur la table 'reports'
  console.log("\n--- Tentative de lecture de la table 'reports' ---");
  const { data: readData, error: readError } = await supabase
    .from('reports')
    .select('*')
    .limit(1);
  
  if (readError) {
    console.error("❌ Erreur de LECTURE :", readError.message);
    console.error("   Code d'erreur :", readError.code);
  } else {
    console.log("✅ Lecture réussie ! Données :", readData);
  }

  // Test d'insertion (factice) pour tester les politiques RLS
  console.log("\n--- Tentative d'insertion dans la table 'reports' ---");
  const { error: insertError } = await supabase
    .from('reports')
    .insert([{
      id: crypto.randomUUID(),
      title: "Test de connexion IA",
      description: "Ceci est un test de l'IA pour vérifier la connexion.",
      category: "waste",
      latitude: 0,
      longitude: 0,
      severity: "low",
      image_url: null,
      points_earned: 0,
      is_duplicate: false,
      user_id: null,
      created_at: new Date().toISOString()
    }]);

  if (insertError) {
    console.error("❌ Erreur d'INSERTION :", insertError.message);
    console.error("   Code d'erreur :", insertError.code);
    console.log("   --> Il est fort probable que les politiques RLS (Row Level Security) bloquent l'insertion publique.");
  } else {
    console.log("✅ Insertion réussie ! La connexion est totale.");
  }
}

checkConnection();
