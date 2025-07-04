import { Location } from "./geolocation";
import { LocationValidation } from "@/types/time-record";

/**
 * Configurações de validação de localização por tipo de operação
 */
export interface LocationValidationConfig {
  maxDistance: number; // Distância máxima em metros
  requireLocation: boolean; // Se é obrigatório ter localização
  allowHomeOffice: boolean; // Se permite trabalho remoto
  toleranceMinutes: number; // Tolerância de atraso em minutos
}

/**
 * Configurações padrão por tipo de operação
 */
export const LOCATION_CONFIGS: Record<string, LocationValidationConfig> = {
  PRESENCIAL: {
    maxDistance: 100, // 100 metros
    requireLocation: true,
    allowHomeOffice: false,
    toleranceMinutes: 15,
  },
  HOME_OFFICE: {
    maxDistance: 0, // Não aplica
    requireLocation: false,
    allowHomeOffice: true,
    toleranceMinutes: 15,
  },
  HYBRID: {
    maxDistance: 100, // 100 metros quando presencial
    requireLocation: true,
    allowHomeOffice: true,
    toleranceMinutes: 15,
  },
};

/**
 * Valida localização para trabalho presencial
 */
export function validatePresentialLocation(
  employeeLocation: Location | null,
  companyLocation: Location,
  config: LocationValidationConfig = LOCATION_CONFIGS.PRESENCIAL,
): LocationValidation {
  // Se não tem localização e é obrigatório
  if (!employeeLocation && config.requireLocation) {
    return {
      isValid: false,
      reason: "Localização é obrigatória para trabalho presencial",
    };
  }

  // Se não tem localização mas não é obrigatório
  if (!employeeLocation && !config.requireLocation) {
    return {
      isValid: true,
      distance: 0,
    };
  }

  // Se tem localização, valida distância
  if (employeeLocation) {
    const distance = calculateDistance(
      employeeLocation.latitude,
      employeeLocation.longitude,
      companyLocation.latitude,
      companyLocation.longitude,
    );

    const isValid = distance <= config.maxDistance;

    return {
      isValid,
      distance,
      reason: isValid ? undefined : `Distância muito grande: ${Math.round(distance)}m (máximo: ${config.maxDistance}m)`,
    };
  }

  return {
    isValid: false,
    reason: "Localização inválida",
  };
}

/**
 * Valida localização para trabalho híbrido
 */
export function validateHybridLocation(
  employeeLocation: Location | null,
  companyLocation: Location,
  isWorkingFromHome: boolean = false,
  config: LocationValidationConfig = LOCATION_CONFIGS.HYBRID,
): LocationValidation {
  // Se está trabalhando de casa
  if (isWorkingFromHome) {
    return {
      isValid: true,
      distance: 0,
    };
  }

  // Se está trabalhando presencialmente
  return validatePresentialLocation(employeeLocation, companyLocation, config);
}

/**
 * Valida localização baseada no tipo de operação da empresa
 */
export function validateLocationByOperationType(
  employeeLocation: Location | null,
  companyLocation: Location,
  operationType: string,
  isWorkingFromHome: boolean = false,
): LocationValidation {
  const config = LOCATION_CONFIGS[operationType] || LOCATION_CONFIGS.PRESENCIAL;

  switch (operationType) {
    case "PRESENCIAL":
      return validatePresentialLocation(employeeLocation, companyLocation, config);
    
    case "HOME_OFFICE":
      return {
        isValid: true,
        distance: 0,
      };
    
    case "HYBRID":
      return validateHybridLocation(employeeLocation, companyLocation, isWorkingFromHome, config);
    
    default:
      return validatePresentialLocation(employeeLocation, companyLocation, config);
  }
}

/**
 * Calcula a distância entre dois pontos usando a fórmula de Haversine
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
 * Verifica se a localização está dentro de uma área específica (círculo)
 */
export function isLocationInArea(
  point: Location,
  center: Location,
  radius: number,
): boolean {
  const distance = calculateDistance(
    point.latitude,
    point.longitude,
    center.latitude,
    center.longitude,
  );
  return distance <= radius;
}

/**
 * Verifica se a localização está dentro de uma área retangular
 */
export function isLocationInRectangle(
  point: Location,
  topLeft: Location,
  bottomRight: Location,
): boolean {
  return (
    point.latitude <= topLeft.latitude &&
    point.latitude >= bottomRight.latitude &&
    point.longitude >= topLeft.longitude &&
    point.longitude <= bottomRight.longitude
  );
}

/**
 * Obtém endereço aproximado baseado nas coordenadas (mock)
 * Em produção, seria integrado com Google Maps Geocoding API
 */
export async function getAddressFromCoordinates(location: Location): Promise<string> {
  try {
    // Em produção, isso seria uma chamada para Google Maps Geocoding API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.results && data.results[0]) {
      return data.results[0].formatted_address;
    }
    
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  } catch {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }
}

/**
 * Gera relatório de validação de localização
 */
export function generateLocationReport(
  employeeLocation: Location | null,
  companyLocation: Location,
  operationType: string,
  validation: LocationValidation,
): {
  isValid: boolean;
  report: string;
  details: {
    operationType: string;
    hasLocation: boolean;
    distance?: number;
    reason?: string;
  };
} {
  const details = {
    operationType,
    hasLocation: !!employeeLocation,
    distance: validation.distance,
    reason: validation.reason,
  };

  let report = `Validação de Localização - ${operationType}\n`;
  report += `Status: ${validation.isValid ? "✅ Válida" : "❌ Inválida"}\n`;
  
  if (employeeLocation) {
    report += `Localização: ${employeeLocation.latitude.toFixed(6)}, ${employeeLocation.longitude.toFixed(6)}\n`;
  } else {
    report += `Localização: Não capturada\n`;
  }
  
  if (validation.distance !== undefined) {
    report += `Distância da empresa: ${Math.round(validation.distance)}m\n`;
  }
  
  if (validation.reason) {
    report += `Motivo: ${validation.reason}\n`;
  }

  return {
    isValid: validation.isValid,
    report,
    details,
  };
} 