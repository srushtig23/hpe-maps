// dataService.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://vsmvkwawpnwkftfgnjma.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzbXZrd2F3cG53a2Z0Zmduam1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTgwODQsImV4cCI6MjA2MDY5NDA4NH0.Ei9X5KWA76GESSHEiTprvJQLWkEhlwfIyrq3jC-NmcA'; // 🔐 Keep secure in production
export const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchCrimeData() {
  const { data, error } = await supabase
    .from('CrimeDB')
    .select('latt, long, rating');

  if (error) {
    console.error('Supabase fetch error:', error);
    return [];
  }

  return data.filter(d =>
    typeof d.latt === 'number' &&
    typeof d.long === 'number' &&
    typeof d.rating === 'number' &&
    d.rating >= 0 && d.rating <= 10
  );
}
