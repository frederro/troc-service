"use client";
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

function getMarkerIcon(categorie: string, isActive: boolean) {
  const isService =
    categorie === 'Services' ||
    categorie === 'Compétences numériques' ||
    categorie === 'Coups de main';
  const color = isService ? '#1D9E75' : '#E8622A';
  return {
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    fillColor: isActive ? '#FFD700' : color,
    fillOpacity: 1,
    strokeColor: isActive ? '#B8860B' : 'white',
    strokeWeight: isActive ? 2.5 : 1.5,
    scale: isActive ? 2.2 : 1.6,
    anchor: { x: 12, y: 22 } as google.maps.Point,
    labelOrigin: { x: 12, y: -5 } as google.maps.Point,
  };
}

const USER_MARKER_BLUE = "#3B82F6";

function getUserLocationIcon(): google.maps.Symbol {
  return {
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    fillColor: USER_MARKER_BLUE,
    fillOpacity: 1,
    strokeColor: "white",
    strokeWeight: 1.5,
    scale: 1.9,
    anchor: { x: 12, y: 22 } as google.maps.Point,
  };
}

/** Clé stable pour regrouper les annonces par ville (champ localisation). */
function localisationKey(localisation: unknown): string {
  const s = String(localisation ?? '').trim().toLowerCase();
  return s || '__sans_localisation__';
}

/** Compte les annonces par même localisation (ville). */
function countByLocalisation(annonces: any[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const a of annonces) {
    const key = localisationKey(a.localisation);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

// Décale les annonces qui ont les mêmes coordonnées en spirale
function spreadOverlappingMarkers(annonces: any[]): any[] {
  const groups: Record<string, any[]> = {};
  for (const a of annonces) {
    const key = `${parseFloat(a.latitude).toFixed(5)}_${parseFloat(a.longitude).toFixed(5)}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }
  const result: any[] = [];
  for (const group of Object.values(groups)) {
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      const spiralStep = 0.0012;
      group.forEach((a, i) => {
        if (i === 0) {
          result.push(a);
        } else {
          const angle = (i * 137.5 * Math.PI) / 180; // angle doré
          const radius = spiralStep * Math.sqrt(i);
          result.push({
            ...a,
            latitude: parseFloat(a.latitude) + radius * Math.cos(angle),
            longitude: parseFloat(a.longitude) + radius * Math.sin(angle),
          });
        }
      });
    }
  }
  return result;
}

function annoncesWithValidCoords(annonces: any[]): any[] {
  return annonces.filter(
    (a) =>
      a.latitude != null &&
      a.longitude != null &&
      !isNaN(parseFloat(a.latitude)) &&
      !isNaN(parseFloat(a.longitude))
  );
}

const FRANCE_CENTER = { lat: 46.6033, lng: 1.8883 };
const ZOOM_FRANCE = 6;
const ZOOM_USER = 11;
const FIT_SINGLE_ZOOM = 13;

export default function MapComponent({
  annonces = [],
  annonceActiveId,
  onAnnonceSelect,
  userLat,
  userLng,
  fitBounds = false,
}: {
  annonces?: any[];
  annonceActiveId?: number | null;
  onAnnonceSelect?: (id: number | null) => void;
  userLat?: number | null;
  userLng?: number | null;
  fitBounds?: boolean;
}) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(FRANCE_CENTER);
  const [zoom, setZoom] = useState(ZOOM_FRANCE);
  const [recherche, setRecherche] = useState("");
  const [infoOuverte, setInfoOuverte] = useState<number | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  });

  const hasUserPosition =
    userLat != null &&
    userLng != null &&
    Number.isFinite(userLat) &&
    Number.isFinite(userLng);

  useEffect(() => {
    if (!hasUserPosition || fitBounds) return;
    const pos = { lat: userLat as number, lng: userLng as number };
    setCenter(pos);
    setZoom(ZOOM_USER);
    if (map) {
      map.panTo(pos);
      map.setZoom(ZOOM_USER);
    }
  }, [userLat, userLng, hasUserPosition, map, fitBounds]);

  useEffect(() => {
    if (!map || !fitBounds) return;
    const avecCoords = annoncesWithValidCoords(annonces);
    if (avecCoords.length === 0) return;

    const etalees = spreadOverlappingMarkers(avecCoords);

    if (etalees.length === 1) {
      const a = etalees[0];
      const lat = parseFloat(a.latitude);
      const lng = parseFloat(a.longitude);
      const pos = { lat, lng };
      setCenter(pos);
      setZoom(FIT_SINGLE_ZOOM);
      map.setCenter(pos);
      map.setZoom(FIT_SINGLE_ZOOM);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    for (const a of etalees) {
      bounds.extend({
        lat: parseFloat(a.latitude),
        lng: parseFloat(a.longitude),
      });
    }
    map.fitBounds(bounds, 50);
    const c = map.getCenter();
    const z = map.getZoom();
    if (c) setCenter({ lat: c.lat(), lng: c.lng() });
    if (z != null) setZoom(z);
  }, [map, fitBounds, annonces]);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const chercherVille = async () => {
    if (!recherche) return;
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(recherche)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`);
    const data = await res.json();
    if (data.results && data.results[0]) {
      const { lat, lng } = data.results[0].geometry.location;
      const newPos = { lat, lng };
      setCenter(newPos);
      setZoom(13);
      if (map) map.panTo(newPos);
    }
  };

  const handleMarkerClick = (annonce: any) => {
    setInfoOuverte(annonce.id);
    onAnnonceSelect?.(annonce.id);
    if (map) {
      map.panTo({ lat: parseFloat(annonce.latitude), lng: parseFloat(annonce.longitude) });
    }
  };

  const mapOptions = {
    mapTypeControlOptions: { position: 7 },
    styles: [
      { featureType: "poi", stylers: [{ visibility: "off" }] },
      { featureType: "transit", stylers: [{ visibility: "off" }] }
    ]
  };

  const activeId = annonceActiveId ?? infoOuverte;

  const annoncesAvecCoords = annonces.filter(
    (a) => a.latitude != null && a.longitude != null &&
           !isNaN(parseFloat(a.latitude)) && !isNaN(parseFloat(a.longitude))
  );

  const localisationCounts = countByLocalisation(annoncesAvecCoords);
  const annoncesEtalees = spreadOverlappingMarkers(annoncesAvecCoords);

  return isLoaded ? (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>

      <div style={{
        position: 'absolute', bottom: '30px', left: '10px', zIndex: 10,
        background: 'white', borderRadius: '8px', padding: '8px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)', fontSize: '12px',
        display: 'flex', flexDirection: 'column', gap: '5px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#1D9E75' }}></div>
          <span>Services / Compétences</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#E8622A' }}></div>
          <span>Objets / Vêtements</span>
        </div>
      </div>

      <div className="mapSearch" style={{
        position: 'absolute', top: '10px', right: '10px', zIndex: 10,
        display: 'flex', gap: '6px',
        background: 'white', padding: '6px', borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        <input
          className="mapSearchInput"
          style={{
            padding: '8px 14px', borderRadius: '6px',
            border: '1px solid #ddd', width: '200px',
            fontSize: '14px', outline: 'none', color: '#333',
            background: 'white'
          }}
          placeholder="Rechercher une ville..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && chercherVille()}
        />
        <button
          className="mapSearchBtn"
          onClick={chercherVille}
          style={{
            padding: '8px 14px', background: '#1D9E75', color: 'white',
            border: 'none', borderRadius: '6px', cursor: 'pointer',
            fontWeight: '600', fontSize: '14px'
          }}
        >
          OK
        </button>
      </div>

      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={zoom}
        onLoad={onMapLoad}
        options={mapOptions}
        onClick={() => { setInfoOuverte(null); onAnnonceSelect?.(null); }}
      >
        {hasUserPosition && (
          <Marker
            position={{ lat: userLat as number, lng: userLng as number }}
            title="Votre position"
            icon={getUserLocationIcon()}
            label={{ text: "📍", color: "#ffffff", fontSize: "14px", fontWeight: "bold" }}
            zIndex={2000}
          />
        )}
        {annoncesEtalees.map((annonce) => {
          const locKey = localisationKey(annonce.localisation);
          const count = localisationCounts[locKey] ?? 1;
          return (
            <Marker
              key={annonce.id}
              position={{ lat: parseFloat(annonce.latitude), lng: parseFloat(annonce.longitude) }}
              title={annonce.titre}
              icon={getMarkerIcon(annonce.categorie, activeId === annonce.id)}
              label={
                count >= 1
                  ? {
                      text: String(count),
                      color: '#111111',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      className: 'marker-label-above',
                    }
                  : undefined
              }
              onClick={() => handleMarkerClick(annonce)}
              zIndex={activeId === annonce.id ? 999 : 1}
            />
          );
        })}
      </GoogleMap>

      {activeId && (() => {
        const a = annoncesAvecCoords.find(x => x.id === activeId);
        if (!a) return null;
        return (
          <div style={{
            position: 'absolute', bottom: '30px', right: '10px', zIndex: 10,
            background: 'white', borderRadius: '10px', padding: '12px 16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)', maxWidth: '220px'
          }}>
            {a.photos?.[0] && (
              <img src={a.photos[0]} alt={a.titre}
                style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }} />
            )}
            <div style={{ fontSize: '11px', color: '#1D9E75', fontWeight: '600', marginBottom: '4px' }}>{a.categorie}</div>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{a.titre}</div>
            {!!a.echange_souhaite && (
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                Échange contre : <span style={{ color: '#1D9E75', fontWeight: '500' }}>{a.echange_souhaite}</span>
              </div>
            )}
            {!!a.ouvert_propositions && (
              <div style={{ fontSize: '11px', color: '#0F6E56', marginBottom: '6px' }}>
                ✅ Ouvert à toute autre proposition
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: '#999' }}>{a.membre_nom} · {a.localisation}</span>
              <a href={`/annonce/${a.id}`} style={{ fontSize: '11px', color: '#1D9E75', textDecoration: 'none', fontWeight: '600' }}>Voir →</a>
            </div>
          </div>
        );
      })()}

      <style jsx>{`
        @media (max-width: 768px) {
          .mapSearchInput { width: 140px !important; padding: 6px 10px !important; font-size: 13px !important; }
          .mapSearchBtn { padding: 6px 10px !important; font-size: 13px !important; }
        }
      `}</style>
    </div>
  ) : <div style={{ height: '100%', background: '#f0f0f0', borderRadius: '12px' }} />;
}
