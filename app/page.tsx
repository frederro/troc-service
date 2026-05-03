import React from 'react';
import type { Metadata } from 'next';
import { supabase } from './supabase';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: "Troc-Service",
  description:
    "Plus besoin d'argent, faites-vous plaisir en échangeant. Objets, services, savoir-faire, trouvez votre troc idéal.",
};

export const revalidate = 0;

export default async function Home() {
  const { data: annonces } = await supabase
    .from('annonces')
    .select('*')
    .order('created_at', { ascending: false });

  return <HomeClient annonces={(annonces || []) as any[]} />;
}