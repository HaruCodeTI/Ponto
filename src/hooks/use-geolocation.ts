"use client";

import { useCallback, useEffect, useState } from "react";
import { getCurrentLocation, Location, validateLocation } from "@/lib/geolocation";

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

interface UseGeolocationReturn {
  location: Location | null;
  error: string | null;
  loading: boolean;
  getLocation: () => Promise<Location>;
  validateCompanyLocation: (
    companyLocation: Location,
    maxDistance?: number,
  ) => { isValid: boolean; distance: number; error?: string };
}

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { enableHighAccuracy = true, timeout = 10000, maximumAge = 60000, watch = false } = options;

  const getLocation = useCallback(async (): Promise<Location> => {
    setLoading(true);
    setError(null);

    try {
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
      return currentLocation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const validateCompanyLocation = useCallback(
    (companyLocation: Location, maxDistance: number = 100) => {
      if (!location) {
        return {
          isValid: false,
          distance: 0,
          error: "Localização não disponível",
        };
      }

      return validateLocation(location, companyLocation, maxDistance);
    },
    [location],
  );

  useEffect(() => {
    if (watch && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setError(null);
        },
        (err) => {
          let errorMessage = "Erro na geolocalização";
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = "Permissão de localização negada";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = "Informação de localização indisponível";
              break;
            case err.TIMEOUT:
              errorMessage = "Tempo limite excedido";
              break;
          }
          setError(errorMessage);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        },
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [watch, enableHighAccuracy, timeout, maximumAge]);

  return {
    location,
    error,
    loading,
    getLocation,
    validateCompanyLocation,
  };
}
