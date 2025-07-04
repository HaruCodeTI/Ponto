import { Location } from "./geolocation";
import { DeviceValidation } from "@/types/time-record";

/**
 * Informações do IP obtidas via API externa
 */
export interface IPInfo {
  ip: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
}

/**
 * Configurações de validação por IP
 */
export interface IPValidationConfig {
  allowedCountries?: string[]; // Códigos de país permitidos (ex: ['BR', 'US'])
  allowedRegions?: string[]; // Regiões específicas permitidas
  allowedCities?: string[]; // Cidades específicas permitidas
  maxDistanceFromHome?: number; // Distância máxima do endereço cadastrado (metros)
  requireVPN?: boolean; // Se VPN é obrigatória
  blockPublicIPs?: boolean; // Se bloquear IPs públicos
}

/**
 * Resultado da validação por IP
 */
export interface IPValidationResult {
  isValid: boolean;
  ipInfo?: IPInfo;
  reason?: string;
  warnings: string[];
  deviceValidation: DeviceValidation;
}

/**
 * Obtém informações do IP do cliente
 */
export async function getClientIPInfo(): Promise<IPInfo | null> {
  try {
    // Em produção, isso seria obtido via headers do servidor ou API externa
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.reason || "Erro ao obter informações do IP");
    }

    return {
      ip: data.ip,
      country: data.country,
      region: data.region,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      isp: data.org || "Desconhecido",
      org: data.org || "Desconhecido",
      as: data.asn || "Desconhecido",
    };
  } catch (error) {
    console.error("Erro ao obter informações do IP:", error);
    return null;
  }
}

/**
 * Valida IP para trabalho home office
 */
export async function validateIPForHomeOffice(
  config: IPValidationConfig = {},
  homeLocation?: Location,
): Promise<IPValidationResult> {
  const warnings: string[] = [];
  const deviceValidation: DeviceValidation = {
    isValid: true,
    deviceId: "IP_VALIDATION",
  };

  try {
    const ipInfo = await getClientIPInfo();
    
    if (!ipInfo) {
      return {
        isValid: false,
        reason: "Não foi possível obter informações do IP",
        warnings,
        deviceValidation: {
          ...deviceValidation,
          isValid: false,
          reason: "IP não identificado",
        },
      };
    }

    // Validação por país
    if (config.allowedCountries && config.allowedCountries.length > 0) {
      if (!config.allowedCountries.includes(ipInfo.country)) {
        return {
          isValid: false,
          ipInfo,
          reason: `País não permitido: ${ipInfo.country}`,
          warnings,
          deviceValidation: {
            ...deviceValidation,
            isValid: false,
            reason: `País bloqueado: ${ipInfo.country}`,
          },
        };
      }
    }

    // Validação por região
    if (config.allowedRegions && config.allowedRegions.length > 0) {
      if (!config.allowedRegions.includes(ipInfo.region)) {
        warnings.push(`Região não configurada: ${ipInfo.region}`);
      }
    }

    // Validação por cidade
    if (config.allowedCities && config.allowedCities.length > 0) {
      if (!config.allowedCities.includes(ipInfo.city)) {
        warnings.push(`Cidade não configurada: ${ipInfo.city}`);
      }
    }

    // Validação de distância do endereço cadastrado
    if (config.maxDistanceFromHome && homeLocation) {
      const distance = calculateDistance(
        ipInfo.latitude,
        ipInfo.longitude,
        homeLocation.latitude,
        homeLocation.longitude,
      );

      if (distance > config.maxDistanceFromHome) {
        return {
          isValid: false,
          ipInfo,
          reason: `IP muito distante do endereço cadastrado: ${Math.round(distance)}m`,
          warnings,
          deviceValidation: {
            ...deviceValidation,
            isValid: false,
            reason: `Localização IP muito distante`,
          },
        };
      }
    }

    // Validação de VPN (simulada)
    if (config.requireVPN) {
      const isVPN = await checkIfVPN(ipInfo);
      if (!isVPN) {
        warnings.push("VPN não detectada (recomendado para segurança)");
      }
    }

    // Validação de IP público
    if (config.blockPublicIPs) {
      const isPublicIP = checkIfPublicIP(ipInfo.ip);
      if (isPublicIP) {
        return {
          isValid: false,
          ipInfo,
          reason: "IP público não permitido",
          warnings,
          deviceValidation: {
            ...deviceValidation,
            isValid: false,
            reason: "IP público bloqueado",
          },
        };
      }
    }

    return {
      isValid: true,
      ipInfo,
      warnings,
      deviceValidation,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return {
      isValid: false,
      reason: `Erro na validação de IP: ${errorMessage}`,
      warnings,
      deviceValidation: {
        ...deviceValidation,
        isValid: false,
        reason: errorMessage,
      },
    };
  }
}

/**
 * Verifica se o IP é de uma VPN (simulação)
 */
async function checkIfVPN(ipInfo: IPInfo): Promise<boolean> {
  // Em produção, isso seria uma verificação real contra base de dados de VPNs
  const vpnKeywords = ["vpn", "proxy", "tunnel", "tor", "anonymous"];
  const ispLower = ipInfo.isp.toLowerCase();
  
  return vpnKeywords.some(keyword => ispLower.includes(keyword));
}

/**
 * Verifica se o IP é público
 */
function checkIfPublicIP(ip: string): boolean {
  // IPs privados: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
  ];

  return !privateRanges.some(range => range.test(ip));
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
 * Gera relatório de validação por IP
 */
export function generateIPValidationReport(
  ipInfo: IPInfo,
  validation: IPValidationResult,
): string {
  let report = "Relatório de Validação por IP\n";
  report += "==============================\n\n";
  
  report += `IP: ${ipInfo.ip}\n`;
  report += `País: ${ipInfo.country}\n`;
  report += `Região: ${ipInfo.region}\n`;
  report += `Cidade: ${ipInfo.city}\n`;
  report += `Provedor: ${ipInfo.isp}\n`;
  report += `Organização: ${ipInfo.org}\n`;
  report += `AS: ${ipInfo.as}\n`;
  report += `Fuso Horário: ${ipInfo.timezone}\n`;
  report += `Coordenadas: ${ipInfo.latitude.toFixed(6)}, ${ipInfo.longitude.toFixed(6)}\n\n`;
  
  report += `Status: ${validation.isValid ? "✅ Válido" : "❌ Inválido"}\n`;
  
  if (validation.reason) {
    report += `Motivo: ${validation.reason}\n`;
  }
  
  if (validation.warnings.length > 0) {
    report += `\nAvisos:\n`;
    validation.warnings.forEach(warning => {
      report += `⚠️  ${warning}\n`;
    });
  }
  
  return report;
}

/**
 * Configurações padrão para validação de IP
 */
export const DEFAULT_IP_CONFIG: IPValidationConfig = {
  allowedCountries: ["BR"], // Apenas Brasil por padrão
  maxDistanceFromHome: 5000, // 5km do endereço cadastrado
  requireVPN: false, // VPN opcional
  blockPublicIPs: false, // IPs públicos permitidos
}; 