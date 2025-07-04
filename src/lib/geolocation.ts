export interface Location {
  latitude: number;
  longitude: number;
}

export interface LocationValidation {
  isValid: boolean;
  distance: number;
  error?: string;
}

/**
 * Calcula a distância entre dois pontos usando a fórmula de Haversine
 * @param lat1 Latitude do primeiro ponto
 * @param lon1 Longitude do primeiro ponto
 * @param lat2 Latitude do segundo ponto
 * @param lon2 Longitude do segundo ponto
 * @returns Distância em metros
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Valida se uma localização está dentro do raio permitido
 * @param userLocation Localização do usuário
 * @param companyLocation Localização da empresa
 * @param maxDistance Distância máxima permitida em metros
 * @returns Resultado da validação
 */
export function validateLocation(
  userLocation: Location,
  companyLocation: Location,
  maxDistance: number = 100, // 100 metros por padrão
): LocationValidation {
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    companyLocation.latitude,
    companyLocation.longitude,
  );

  return {
    isValid: distance <= maxDistance,
    distance,
    error: distance > maxDistance ? `Distância muito grande: ${Math.round(distance)}m` : undefined,
  };
}

/**
 * Captura a localização atual do usuário
 * @returns Promise com a localização
 */
export function getCurrentLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalização não suportada"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Permissão de localização negada"));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Informação de localização indisponível"));
            break;
          case error.TIMEOUT:
            reject(new Error("Tempo limite excedido"));
            break;
          default:
            reject(new Error("Erro desconhecido na geolocalização"));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  });
}

/**
 * Formata coordenadas para exibição
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns String formatada
 */
export function formatCoordinates(latitude: number, longitude: number): string {
  const lat = Math.abs(latitude);
  const lon = Math.abs(longitude);
  const latDir = latitude >= 0 ? "N" : "S";
  const lonDir = longitude >= 0 ? "E" : "W";

  return `${lat.toFixed(6)}°${latDir}, ${lon.toFixed(6)}°${lonDir}`;
}

/**
 * Gera um hash único para o registro de ponto baseado na localização
 * @param location Localização
 * @param timestamp Timestamp
 * @param userId ID do usuário
 * @returns Hash único
 */
export function generateLocationHash(location: Location, timestamp: Date, userId: string): string {
  const data = `${location.latitude}-${location.longitude}-${timestamp.getTime()}-${userId}`;
  return btoa(data).replace(/[^a-zA-Z0-9]/g, "");
}
