"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Location } from "@/lib/geolocation";
import { LocationValidation } from "@/types/time-record";
import { validateLocationByOperationType, generateLocationReport } from "@/lib/location-validation";
import { captureLocationForTimeRecord } from "@/lib/time-record";
import { MapPin, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";

interface LocationValidatorProps {
  companyLocation: Location;
  operationType: string;
  onValidationChange: (validation: LocationValidation) => void;
  isWorkingFromHome?: boolean;
  className?: string;
}

export function LocationValidator({
  companyLocation,
  operationType,
  onValidationChange,
  isWorkingFromHome = false,
  className,
}: LocationValidatorProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const [validation, setValidation] = useState<LocationValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<string>("");

  // Captura localização e valida
  const captureAndValidate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await captureLocationForTimeRecord();
      
      if (result.error) {
        setError(result.error);
        setLocation(null);
        setValidation({ isValid: false, reason: result.error });
        onValidationChange({ isValid: false, reason: result.error });
        return;
      }

      setLocation(result.location);
      
      // Valida localização baseada no tipo de operação
      const locationValidation = validateLocationByOperationType(
        result.location,
        companyLocation,
        operationType,
        isWorkingFromHome,
      );
      
      setValidation(locationValidation);
      onValidationChange(locationValidation);

      // Gera relatório
      if (result.location) {
        const reportData = generateLocationReport(
          result.location,
          companyLocation,
          operationType,
          locationValidation,
        );
        setReport(reportData.report);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao capturar localização";
      setError(errorMessage);
      setValidation({ isValid: false, reason: errorMessage });
      onValidationChange({ isValid: false, reason: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [companyLocation, operationType, isWorkingFromHome, onValidationChange]);

  // Captura localização automaticamente ao montar componente
  useEffect(() => {
    captureAndValidate();
  }, [companyLocation, operationType, isWorkingFromHome, captureAndValidate]);

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (!validation) return <AlertCircle className="h-4 w-4" />;
    return validation.isValid ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = () => {
    if (loading) return <Badge variant="secondary">Capturando...</Badge>;
    if (!validation) return <Badge variant="outline">Não validado</Badge>;
    return validation.isValid ? (
      <Badge variant="default" className="bg-green-500">Válida</Badge>
    ) : (
      <Badge variant="destructive">Inválida</Badge>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Validação de Localização
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações básicas */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Tipo de Operação:</span>
            <p className="text-muted-foreground">{operationType}</p>
          </div>
          <div>
            <span className="font-medium">Modo de Trabalho:</span>
            <p className="text-muted-foreground">
              {isWorkingFromHome ? "Home Office" : "Presencial"}
            </p>
          </div>
        </div>

        {/* Localização capturada */}
        {location && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">Localização Capturada:</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
          </div>
        )}

        {/* Resultado da validação */}
        {validation && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Resultado:</span>
            </div>
            {validation.distance !== undefined && (
              <p className="text-sm text-muted-foreground">
                Distância da empresa: {Math.round(validation.distance)}m
              </p>
            )}
            {validation.reason && (
              <Alert variant={validation.isValid ? "default" : "destructive"}>
                <AlertDescription>{validation.reason}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Erro */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Botão para recapturar */}
        <Button
          onClick={captureAndValidate}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Capturando...
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 mr-2" />
              Recapturar Localização
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