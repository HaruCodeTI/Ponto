"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Location } from "@/lib/geolocation";
import { DeviceValidation } from "@/types/time-record";
import { 
  IPValidationResult, 
  IPValidationConfig, 
  validateIPForHomeOffice, 
  generateIPValidationReport,
  DEFAULT_IP_CONFIG 
} from "@/lib/ip-validation";
import { Globe, Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface IPValidatorProps {
  homeLocation?: Location;
  config?: IPValidationConfig;
  onValidationChange: (validation: DeviceValidation) => void;
  className?: string;
}

export function IPValidator({
  homeLocation,
  config = DEFAULT_IP_CONFIG,
  onValidationChange,
  className,
}: IPValidatorProps) {
  const [validation, setValidation] = useState<IPValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<string>("");

  // Valida IP
  const validateIP = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await validateIPForHomeOffice(config, homeLocation);
      setValidation(result);
      onValidationChange(result.deviceValidation);

      // Gera relatório se tem informações do IP
      if (result.ipInfo) {
        const reportText = generateIPValidationReport(result.ipInfo, result);
        setReport(reportText);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao validar IP";
      setError(errorMessage);
      const errorValidation: DeviceValidation = {
        isValid: false,
        reason: errorMessage,
      };
      onValidationChange(errorValidation);
    } finally {
      setLoading(false);
    }
  }, [config, homeLocation, onValidationChange]);

  // Valida IP automaticamente ao montar componente
  useEffect(() => {
    validateIP();
  }, [validateIP]);

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (!validation) return <AlertTriangle className="h-4 w-4" />;
    return validation.isValid ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = () => {
    if (loading) return <Badge variant="secondary">Validando...</Badge>;
    if (!validation) return <Badge variant="outline">Não validado</Badge>;
    return validation.isValid ? (
      <Badge variant="default" className="bg-green-500">Válido</Badge>
    ) : (
      <Badge variant="destructive">Inválido</Badge>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Validação por IP (Home Office)
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações do IP */}
        {validation?.ipInfo && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="font-medium">Informações do IP:</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">IP:</span>
                <p className="text-muted-foreground font-mono">{validation.ipInfo.ip}</p>
              </div>
              <div>
                <span className="font-medium">País:</span>
                <p className="text-muted-foreground">{validation.ipInfo.country}</p>
              </div>
              <div>
                <span className="font-medium">Cidade:</span>
                <p className="text-muted-foreground">{validation.ipInfo.city}</p>
              </div>
              <div>
                <span className="font-medium">Provedor:</span>
                <p className="text-muted-foreground">{validation.ipInfo.isp}</p>
              </div>
              <div>
                <span className="font-medium">Fuso Horário:</span>
                <p className="text-muted-foreground">{validation.ipInfo.timezone}</p>
              </div>
              <div>
                <span className="font-medium">Coordenadas:</span>
                <p className="text-muted-foreground">
                  {validation.ipInfo.latitude.toFixed(4)}, {validation.ipInfo.longitude.toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Configurações aplicadas */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Configurações Aplicadas:</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Países permitidos: {config.allowedCountries?.join(", ") || "Todos"}</p>
            {config.maxDistanceFromHome && (
              <p>Distância máxima: {config.maxDistanceFromHome}m</p>
            )}
            <p>VPN obrigatória: {config.requireVPN ? "Sim" : "Não"}</p>
            <p>IPs públicos bloqueados: {config.blockPublicIPs ? "Sim" : "Não"}</p>
          </div>
        </div>

        {/* Resultado da validação */}
        {validation && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Resultado:</span>
            </div>
            {validation.reason && (
              <Alert variant={validation.isValid ? "default" : "destructive"}>
                <AlertDescription>{validation.reason}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Avisos */}
        {validation?.warnings && validation.warnings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">Avisos:</span>
            </div>
            {validation.warnings.map((warning, index) => (
              <Alert key={index} variant="default" className="border-yellow-200 bg-yellow-50">
                <AlertDescription>{warning}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Erro */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Botão para revalidar */}
        <Button
          onClick={validateIP}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Validando...
            </>
          ) : (
            <>
              <Globe className="h-4 w-4 mr-2" />
              Revalidar IP
            </>
          )}
        </Button>

        {/* Relatório detalhado (expandível) */}
        {report && (
          <details className="mt-4">
            <summary className="cursor-pointer font-medium text-sm">
              Ver Relatório Detalhado
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded-md text-xs whitespace-pre-wrap">
              {report}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
} 