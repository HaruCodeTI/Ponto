"use client";
import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  NFCConfig, 
  NFCReadResult,
  NFCAuthResponse
} from "@/types/nfc";
import { 
  readNFCCard, 
  isNFCSupported, 
  authenticateViaNFC,
  formatCardNumber,
  getCardTimeRemaining,
  DEFAULT_NFC_CONFIG 
} from "@/lib/nfc";
import { 
  CreditCard, 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  User,
  Wifi,
  Building
} from "lucide-react";
import type { Location } from "@/lib/geolocation";

interface NFCReaderProps {
  companyLocation?: Location;
  config?: NFCConfig;
  onCardRead?: (result: NFCReadResult) => void;
  onAuthentication?: (response: NFCAuthResponse) => void;
  onError?: (error: string) => void;
}

export function NFCReader({
  companyLocation,
  config = DEFAULT_NFC_CONFIG,
  onCardRead,
  onAuthentication,
  onError,
}: NFCReaderProps) {
  const [isReading, setIsReading] = useState(false);
  const [readResult, setReadResult] = useState<NFCReadResult | null>(null);
  const [authResponse, setAuthResponse] = useState<NFCAuthResponse | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(isNFCSupported());
  }, []);

  const handleReadCard = useCallback(async () => {
    if (!isSupported) {
      const errorMsg = "NFC não suportado neste dispositivo";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsReading(true);
    setProgress(0);
    setError(null);
    setReadResult(null);
    setAuthResponse(null);

    try {
      // Simula progresso de leitura
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Lê crachá NFC
      const result = await readNFCCard(config);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setReadResult(result);
      onCardRead?.(result);

      if (result.success && result.cardData) {
        // Autentica funcionário
        const auth = await authenticateViaNFC(result.cardData, companyLocation, config);
        setAuthResponse(auth);
        onAuthentication?.(auth);
      } else {
        setError(result.error || "Erro ao ler crachá");
        onError?.(result.error || "Erro ao ler crachá");
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsReading(false);
      setTimeout(() => setProgress(0), 2000);
    }
  }, [isSupported, config, companyLocation, onCardRead, onAuthentication, onError]);

  const getStatusIcon = () => {
    if (error) return <XCircle className="h-6 w-6 text-red-500" />;
    if (authResponse?.authenticated) return <CheckCircle className="h-6 w-6 text-green-500" />;
    if (readResult?.success) return <Shield className="h-6 w-6 text-blue-500" />;
    if (isReading) return <Wifi className="h-6 w-6 text-yellow-500 animate-pulse" />;
    return <CreditCard className="h-6 w-6 text-gray-400" />;
  };

  const getStatusText = () => {
    if (error) return "Erro na leitura";
    if (authResponse?.authenticated) return "Autenticado com sucesso";
    if (readResult?.success) return "Crachá lido";
    if (isReading) return "Lendo crachá...";
    return "Aguardando crachá";
  };

  const getStatusColor = () => {
    if (error) return "text-red-600";
    if (authResponse?.authenticated) return "text-green-600";
    if (readResult?.success) return "text-blue-600";
    if (isReading) return "text-yellow-600";
    return "text-gray-500";
  };

  if (!isSupported) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <CreditCard className="h-5 w-5 mr-2" />
            Leitor NFC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              NFC não suportado neste dispositivo. Use um dispositivo móvel ou terminal com NFC.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            {getStatusIcon()}
            <span className={`ml-2 ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isReading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600 text-center">
                Aproxime o crachá do dispositivo...
              </p>
            </div>
          )}
          
          <Button
            onClick={handleReadCard}
            disabled={isReading}
            className="w-full mt-4"
            size="lg"
          >
            {isReading ? "Lendo..." : "Ler Crachá NFC"}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Card Information */}
      {readResult?.success && readResult.cardData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CreditCard className="h-5 w-5 mr-2" />
              Informações do Crachá
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Número:</span>
              <Badge variant="outline" className="font-mono">
                {formatCardNumber(readResult.cardData.cardNumber)}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge variant={readResult.cardData.status === 'ACTIVE' ? 'default' : 'destructive'}>
                {readResult.cardData.status}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tipo:</span>
              <Badge variant="outline">
                {readResult.cardData.metadata?.cardType || 'STANDARD'}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Usos:</span>
              <span className="text-sm font-medium">
                {readResult.cardData.usageCount}
                {readResult.cardData.maxUsageCount && ` / ${readResult.cardData.maxUsageCount}`}
              </span>
            </div>

            {readResult.cardData.metadata?.department && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Departamento:</span>
                <span className="text-sm font-medium flex items-center">
                  <Building className="h-3 w-3 mr-1" />
                  {readResult.cardData.metadata.department}
                </span>
              </div>
            )}

            {readResult.cardData.metadata?.role && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cargo:</span>
                <span className="text-sm font-medium flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  {readResult.cardData.metadata.role}
                </span>
              </div>
            )}

            {/* Tempo restante */}
            {readResult.cardData.expiresAt && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Expira em:</span>
                <span className="text-sm font-medium flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {(() => {
                    const timeRemaining = getCardTimeRemaining(readResult.cardData!);
                    if (timeRemaining.isExpired) return "Expirado";
                    if (timeRemaining.daysRemaining) return `${timeRemaining.daysRemaining}d`;
                    if (timeRemaining.hoursRemaining) return `${timeRemaining.hoursRemaining}h`;
                    return "Pouco tempo";
                  })()}
                </span>
              </div>
            )}

            {/* Permissões */}
            <div className="pt-2 border-t">
              <span className="text-sm text-gray-600 block mb-2">Permissões:</span>
              <div className="flex flex-wrap gap-1">
                {readResult.cardData.permissions.map(permission => (
                  <Badge key={permission} variant="secondary" className="text-xs">
                    {permission.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Authentication Result */}
      {authResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              {authResponse.authenticated ? (
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 mr-2 text-red-500" />
              )}
              Resultado da Autenticação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {authResponse.authenticated ? (
              <>
                {authResponse.employeeData && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Funcionário:</span>
                      <span className="text-sm font-medium">{authResponse.employeeData.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">CPF:</span>
                      <span className="text-sm font-medium">{authResponse.employeeData.cpf}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cargo:</span>
                      <span className="text-sm font-medium">{authResponse.employeeData.role}</span>
                    </div>
                  </div>
                )}
                
                {authResponse.timeRecord && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Registro:</span>
                      <Badge variant="default">
                        {authResponse.timeRecord.type}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-600">Hash:</span>
                      <span className="text-xs font-mono text-gray-500">
                        {authResponse.timeRecord.hash.substring(0, 8)}...
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>{authResponse.error}</AlertDescription>
              </Alert>
            )}

            {authResponse.warnings && authResponse.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {authResponse.warnings.join(", ")}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 