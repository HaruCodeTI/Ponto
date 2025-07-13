"use client";

import { Loader } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Location } from "@/lib/geolocation";

/* global google */

interface LocationPickerProps {
  onLocationSelect: (location: Location) => void;
  initialLocation?: Location;
  apiKey: string;
  className?: string;
}

export function LocationPicker({
  onLocationSelect,
  initialLocation,
  apiKey,
  className,
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    initialLocation || null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega a API do Google Maps
  useEffect(() => {
    setLoading(true);
    setError(null);
    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places", "marker"], // Adiciona marker
    });
    loader
      .load()
      .then(() => {
        setLoading(false);
      })
      .catch((err) => {
        setError("Erro ao carregar o mapa");
        setLoading(false);
        console.error("Erro ao carregar Google Maps:", err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Inicializa o mapa e o novo marker
  useEffect(() => {
    if (loading || error || !window.google || !mapRef.current) return;
    const defaultLocation = initialLocation || {
      latitude: -23.5505,
      longitude: -46.6333,
    };
    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: defaultLocation.latitude, lng: defaultLocation.longitude },
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    // Novo marker
    const markerInstance = new google.maps.marker.AdvancedMarkerElement({
      map: mapInstance,
      position: { lat: Number(defaultLocation.latitude), lng: Number(defaultLocation.longitude) },
      title: "Localização da empresa",
      gmpDraggable: true,
    });
    setMap(mapInstance);
    setMarker(markerInstance as any); // para manter tipagem
    setSelectedLocation(defaultLocation);
    // Drag end
    markerInstance.addListener("dragend", (event: any) => {
      const pos = markerInstance.position;
      if (pos) {
        const newLocation: Location = {
          latitude: typeof pos.lat === "function" ? pos.lat() : pos.lat,
          longitude: typeof pos.lng === "function" ? pos.lng() : pos.lng,
        };
        setSelectedLocation(newLocation);
        onLocationSelect(newLocation);
      }
    });
    // Click no mapa
    mapInstance.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const newLocation: Location = {
          latitude: event.latLng.lat(),
          longitude: event.latLng.lng(),
        };
        markerInstance.position = event.latLng;
        setSelectedLocation(newLocation);
        onLocationSelect(newLocation);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error, mapRef.current]);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          if (map && marker) {
            const latLng = new google.maps.LatLng(
              currentLocation.latitude,
              currentLocation.longitude,
            );
            map.setCenter(latLng);
            marker.setPosition(latLng);
            setSelectedLocation(currentLocation);
            onLocationSelect(currentLocation);
          }
        },
        () => {
          setError("Erro ao obter localização atual");
        },
      );
    } else {
      setError("Geolocalização não suportada");
    }
  };

  if (loading) {
    return (
      <div className={className + " flex flex-col items-center justify-center w-full"}>
        <div className="border-primary mb-2 h-8 w-8 animate-spin rounded-full border-b-2" />
        <p>Carregando mapa...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className + " flex flex-col items-center justify-center w-full"}>
        <p className="text-destructive mb-2">{error}</p>
        <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className={className + " w-full max-w-full"}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold">Selecionar Localização</span>
        <Button onClick={handleUseCurrentLocation} variant="outline" size="sm">
          📍 Minha Localização
        </Button>
      </div>
      <div
        ref={mapRef}
        style={{ 
          minHeight: "384px", 
          height: "384px", 
          width: "100%", 
          border: "1px solid #ccc", 
          borderRadius: "8px",
          backgroundColor: "#f0f0f0"
        }}
        className="mb-2"
      />
      {selectedLocation && (
        <div className="space-y-1">
          <Badge variant="secondary" className="w-fit">Localização Selecionada</Badge>
          <div className="text-muted-foreground text-sm">Latitude: {selectedLocation.latitude.toFixed(6)}</div>
          <div className="text-muted-foreground text-sm">Longitude: {selectedLocation.longitude.toFixed(6)}</div>
        </div>
      )}
    </div>
  );
}
