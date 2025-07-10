"use client";

import { Loader } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  console.log("GOOGLE_MAPS_API_KEY recebida:", apiKey);

  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    initialLocation || null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places"],
    });

    loader
      .load()
      .then(() => {
        console.log("google global:", typeof window.google, window.google);
        console.log("google.maps disponível:", !!window.google?.maps);
        if (!mapRef.current) return;

        const defaultLocation = initialLocation || {
          latitude: -23.5505, // São Paulo
          longitude: -46.6333,
        };

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: defaultLocation.latitude, lng: defaultLocation.longitude },
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        const markerInstance = new google.maps.Marker({
          position: { lat: defaultLocation.latitude, lng: defaultLocation.longitude },
          map: mapInstance,
          draggable: true,
          title: "Localização da empresa",
        });

        setMap(mapInstance);
        setMarker(markerInstance);
        setSelectedLocation(defaultLocation);

        // Event listener para quando o marcador é arrastado
        markerInstance.addListener("dragend", () => {
          const position = markerInstance.getPosition();
          if (position) {
            const newLocation: Location = {
              latitude: position.lat(),
              longitude: position.lng(),
            };
            setSelectedLocation(newLocation);
            onLocationSelect(newLocation);
          }
        });

        // Event listener para clique no mapa
        mapInstance.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const newLocation: Location = {
              latitude: event.latLng.lat(),
              longitude: event.latLng.lng(),
            };
            markerInstance.setPosition(event.latLng);
            setSelectedLocation(newLocation);
            onLocationSelect(newLocation);
          }
        });

        setLoading(false);
      })
      .catch((err) => {
        setError("Erro ao carregar o mapa");
        setLoading(false);
        console.error("Erro ao carregar Google Maps:", err);
      });
  }, [apiKey, initialLocation, onLocationSelect]);

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
        (error) => {
          setError("Erro ao obter localização atual");
          console.error("Erro de geolocalização:", error);
        },
      );
    } else {
      setError("Geolocalização não suportada");
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="border-primary mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2"></div>
            <p>Carregando mapa...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-2">{error}</p>
            <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Selecionar Localização</span>
          <Button onClick={handleUseCurrentLocation} variant="outline" size="sm">
            📍 Minha Localização
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          ref={mapRef}
          style={{ minHeight: "384px", height: "384px", width: "100%", border: "1px solid #ccc" }}
        />
        {selectedLocation && (
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit">
              Localização Selecionada
            </Badge>
            <p className="text-muted-foreground text-sm">
              Latitude: {selectedLocation.latitude.toFixed(6)}
            </p>
            <p className="text-muted-foreground text-sm">
              Longitude: {selectedLocation.longitude.toFixed(6)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
