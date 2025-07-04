"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Shield, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Info,
  Copy,
  Download
} from "lucide-react";
import { 
  DeviceValidationConfig, 
  DeviceValidationResult, 
  validateDevice, 
  generateDeviceValidationReport,
  DEFAULT_DEVICE_CONFIG 
} from "@/lib/device-validation";
import { DeviceValidation } from "@/types/time-record";

interface DeviceValidatorProps {
  config?: DeviceValidationConfig;
  onValidationChange: (validation: DeviceValidation) => void;
  className?: string;
}

export function DeviceValidator({
  config = DEFAULT_DEVICE_CONFIG,
  onValidationChange,
  className,
}: DeviceValidatorProps) {
  const [validationResult, setValidationResult] = useState<DeviceValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [report, setReport] = useState<string>("");

  const handleValidate = useCallback(async () => {
    setLoading(true);
    try {
      const result = await validateDevice(config);
      setValidationResult(result);
    } catch (error) {
      console.error("Erro na validação de dispositivo:", error);
      // Cria resultado de erro
      const errorResult: DeviceValidationResult = {
        isValid: false,
        deviceInfo: {
          deviceId: "ERROR",
          deviceType: "UNKNOWN",
          platform: "Unknown",
          browser: "Unknown",
          browserVersion: "",
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          colorDepth: screen.colorDepth,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          languages: [navigator.language],
          cookieEnabled: navigator.cookieEnabled,
          localStorageEnabled: false,
          sessionStorageEnabled: false,
          isSecureContext: window.isSecureContext,
          isVirtualMachine: false,
          isEmulator: false,
          isMobile: false,
          isTablet: false,
          isDesktop: false,
        },
        deviceId: "ERROR",
        reason: "Erro na validação",
        warnings: [],
        errors: ["Erro interno na validação de dispositivo"],
        confidence: 0,
        metadata: {
          validationTime: new Date().toISOString(),
          duration: 0,
        },
      };
      setValidationResult(errorResult);
    } finally {
      setLoading(false);
    }
  }, [config]);

  // Executa validação automaticamente ao montar
  useEffect(() => {
    handleValidate();
  }, [handleValidate]);

  // Atualiza callback quando resultado muda
  useEffect(() => {
    if (validationResult) {
      onValidationChange({
        isValid: validationResult.isValid,
        deviceId: validationResult.deviceId,
        reason: validationResult.reason,
      });
    }
  }, [validationResult, onValidationChange]);

  // Gera relatório quando resultado muda
  useEffect(() => {
    if (validationResult) {
      const reportText = generateDeviceValidationReport(validationResult);
      setReport(reportText);
    }
  }, [validationResult]);

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (!validationResult) return <Smartphone className="h-4 w-4" />;
    
    const { deviceInfo } = validationResult;
    if (deviceInfo.isMobile) return <Smartphone className="h-4 w-4" />;
    if (deviceInfo.isTablet) return <Tablet className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const getStatusBadge = () => {
    if (loading) return <Badge variant="secondary">Validando...</Badge>;
    if (!validationResult) return <Badge variant="outline">Não validado</Badge>;
    
    return validationResult.isValid ? (
      <Badge variant="default" className="bg-green-500">Válido</Badge>
    ) : (
      <Badge variant="destructive">Inválido</Badge>
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-500";
    if (confidence >= 0.6) return "text-yellow-500";
    return "text-red-500";
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Poderia adicionar toast aqui
    } catch (error) {
      console.error("Erro ao copiar:", error);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `device-validation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Validação de Dispositivo
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configurações */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span className="font-medium">Configurações:</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Mobile: {config.allowMobile ? "✅" : "❌"}</p>
            <p>Desktop: {config.allowDesktop ? "✅" : "❌"}</p>
            <p>Tablet: {config.allowTablet ? "✅" : "❌"}</p>
            <p>Bloqueia VMs: {config.blockVirtualMachines ? "✅" : "❌"}</p>
            <p>Bloqueia Emuladores: {config.blockEmulators ? "✅" : "❌"}</p>
            <p>HTTPS obrigatório: {config.requireSecureContext ? "✅" : "❌"}</p>
          </div>
        </div>

        {/* Resultado da validação */}
        {validationResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Resultado:</span>
              {validationResult.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>

            {/* Informações básicas */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Tipo:</span> {validationResult.deviceInfo.deviceType}
              </div>
              <div>
                <span className="font-medium">Plataforma:</span> {validationResult.deviceInfo.platform}
              </div>
              <div>
                <span className="font-medium">Navegador:</span> {validationResult.deviceInfo.browser} {validationResult.deviceInfo.browserVersion}
              </div>
              <div>
                <span className="font-medium">Resolução:</span> {validationResult.deviceInfo.screenResolution}
              </div>
              <div>
                <span className="font-medium">Confiança:</span>
                <span className={`ml-1 ${getConfidenceColor(validationResult.confidence)}`}>
                  {Math.round(validationResult.confidence * 100)}%
                </span>
              </div>
              <div>
                <span className="font-medium">Device ID:</span>
                <span className="ml-1 font-mono text-xs">
                  {validationResult.deviceId.substring(0, 8)}...
                </span>
              </div>
            </div>

            {/* Status de segurança */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Segurança:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  {validationResult.deviceInfo.isSecureContext ? (
                    <Shield className="h-3 w-3 text-green-500" />
                  ) : (
                    <ShieldAlert className="h-3 w-3 text-yellow-500" />
                  )}
                  <span>HTTPS</span>
                </div>
                <div className="flex items-center gap-1">
                  {validationResult.deviceInfo.isVirtualMachine ? (
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                  <span>Máquina Virtual</span>
                </div>
                <div className="flex items-center gap-1">
                  {validationResult.deviceInfo.isEmulator ? (
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                  <span>Emulador</span>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {validationResult.warnings.map((warning, index) => (
                      <div key={index} className="text-sm">• {warning}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <div key={index} className="text-sm">• {error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Botões de ação */}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowDetails(!showDetails)}
                variant="outline"
                size="sm"
              >
                {showDetails ? "Ocultar" : "Ver"} Detalhes
              </Button>
              <Button
                onClick={() => copyToClipboard(validationResult.deviceId)}
                variant="outline"
                size="sm"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copiar ID
              </Button>
              <Button
                onClick={downloadReport}
                variant="outline"
                size="sm"
                disabled={!report}
              >
                <Download className="h-3 w-3 mr-1" />
                Relatório
              </Button>
            </div>

            {/* Detalhes expandidos */}
            {showDetails && (
              <div className="space-y-3">
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Informações Detalhadas</h4>
                  <div className="text-xs space-y-1">
                    <div><span className="font-medium">User Agent:</span> {validationResult.deviceInfo.userAgent}</div>
                    <div><span className="font-medium">Timezone:</span> {validationResult.deviceInfo.timezone}</div>
                    <div><span className="font-medium">Idioma:</span> {validationResult.deviceInfo.language}</div>
                    <div><span className="font-medium">Cookies:</span> {validationResult.deviceInfo.cookieEnabled ? "Habilitado" : "Desabilitado"}</div>
                    <div><span className="font-medium">LocalStorage:</span> {validationResult.deviceInfo.localStorageEnabled ? "Habilitado" : "Desabilitado"}</div>
                    <div><span className="font-medium">SessionStorage:</span> {validationResult.deviceInfo.sessionStorageEnabled ? "Habilitado" : "Desabilitado"}</div>
                    {validationResult.deviceInfo.hardwareConcurrency && (
                      <div><span className="font-medium">CPU Cores:</span> {validationResult.deviceInfo.hardwareConcurrency}</div>
                    )}
                    {validationResult.deviceInfo.maxTouchPoints && (
                      <div><span className="font-medium">Touch Points:</span> {validationResult.deviceInfo.maxTouchPoints}</div>
                    )}
                    <div><span className="font-medium">Tempo de Validação:</span> {validationResult.metadata.validationTime}</div>
                    <div><span className="font-medium">Duração:</span> {validationResult.metadata.duration}ms</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botão de revalidação */}
        <Button
          onClick={handleValidate}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Validando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Revalidar Dispositivo
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
} 