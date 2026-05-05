import type { MetadataRoute } from 'next'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SITE_URL = 'https://www.troc-service.eu'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/decouvrir`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase isn't configured (local env, preview, etc.), still serve a valid sitemap.
  if (!supabaseUrl || !supabaseKey) return staticUrls

  const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

  try {
    const { data: annonces, error } = await supabase
      .from('annonces')
      .select('id, created_at')
      .order('created_at', { ascending: false })

    if (error) return staticUrls

    const annoncesUrls: MetadataRoute.Sitemap = (annonces ?? [])
      .filter((a) => Boolean(a?.id))
      .map((a) => ({
        url: `${SITE_URL}/annonce/${a.id}`,
        lastModified: a.created_at ?? new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }))

    return [...staticUrls, ...annoncesUrls]
  } catch {
    return staticUrls
  }
}

