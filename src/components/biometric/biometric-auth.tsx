"use client";
import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  BiometricMethod,
  BiometricAuthConfig, 
  BiometricAuthResult 
} from "@/types/biometric";
import { 
  authenticateBiometric, 
  isBiometricSupported, 
  detectBiometricMethod,
  DEFAULT_BIOMETRIC_CONFIG 
} from "@/lib/biometric";
import { 
  Fingerprint, 
  User, 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Smartphone,
  Monitor
} from "lucide-react";

interface BiometricAuthProps {
  config?: BiometricAuthConfig;
  onAuthentication?: (result: BiometricAuthResult) => void;
  onError?: (error: string) => void;
}

export function BiometricAuth({
  config = DEFAULT_BIOMETRIC_CONFIG,
  onAuthentication,
  onError,
}: BiometricAuthProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authResult, setAuthResult] = useState<BiometricAuthResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [detectedMethod, setDetectedMethod] = useState<BiometricMethod>('UNKNOWN');

  useEffect(() => {
    setIsSupported(isBiometricSupported());
    setDetectedMethod(detectBiometricMethod());
  }, []);

  const handleAuthenticate = useCallback(async () => {
    if (!isSupported) {
      const errorMsg = "Biometria não suportada neste dispositivo";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsAuthenticating(true);
    setProgress(0);
    setError(null);
    setAuthResult(null);

    try {
      // Simula progresso de autenticação
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 200);

      // Autentica biométricamente
      const result = await authenticateBiometric(config);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setAuthResult(result);
      onAuthentication?.(result);

      if (!result.success) {
        setError(result.error || "Erro na autenticação biométrica");
        onError?.(result.error || "Erro na autenticação biométrica");
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsAuthenticating(false);
      setTimeout(() => setProgress(0), 2000);
    }
  }, [isSupported, config, onAuthentication, onError]);

  const getMethodIcon = (method: BiometricMethod) => {
    switch (method) {
      case 'FINGERPRINT':
        return <Fingerprint className="h-5 w-5" />;
      case 'FACE':
        return <User className="h-5 w-5" />;
      case 'WEBAUTHN':
        return <Shield className="h-5 w-5" />;
      case 'PIN':
        return <Clock className="h-5 w-5" />;
      default:
        return <Smartphone className="h-5 w-5" />;
    }
  };

  const getMethodName = (method: BiometricMethod) => {
    switch (method) {
      case 'FINGERPRINT':
        return "Digital";
      case 'FACE':
        return "Face ID";
      case 'WEBAUTHN':
        return "WebAuthn";
      case 'PIN':
        return "PIN";
      default:
        return "Biometria";
    }
  };

  const getStatusIcon = () => {
    if (error) return <XCircle className="h-6 w-6 text-red-500" />;
    if (authResult?.success) return <CheckCircle className="h-6 w-6 text-green-500" />;
    if (isAuthenticating) return <Fingerprint className="h-6 w-6 text-blue-500 animate-pulse" />;
    return <Shield className="h-6 w-6 text-gray-400" />;
  };

  const getStatusText = () => {
    if (error) return "Erro na autenticação";
    if (authResult?.success) return "Autenticado com sucesso";
    if (isAuthenticating) return "Autenticando...";
    return "Aguardando autenticação";
  };

  const getStatusColor = () => {
    if (error) return "text-red-600";
    if (authResult?.success) return "text-green-600";
    if (isAuthenticating) return "text-blue-600";
    return "text-gray-500";
  };

  if (!isSupported) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Fingerprint className="h-5 w-5 mr-2" />
            Autenticação Biométrica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Biometria não suportada neste dispositivo. Use um dispositivo móvel ou computador com suporte a WebAuthn.
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
          {isAuthenticating && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600 text-center">
                Use {getMethodName(detectedMethod)} para autenticar...
              </p>
            </div>
          )}
          
          <Button
            onClick={handleAuthenticate}
            disabled={isAuthenticating}
            className="w-full mt-4"
            size="lg"
          >
            {isAuthenticating ? "Autenticando..." : `Autenticar com ${getMethodName(detectedMethod)}`}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Authentication Result */}
      {authResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              {authResult.success ? (
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 mr-2 text-red-500" />
              )}
              Resultado da Autenticação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {authResult.success ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Método:</span>
                  <Badge variant="outline" className="flex items-center">
                    {getMethodIcon(authResult.method)}
                    <span className="ml-1">{getMethodName(authResult.method)}</span>
                  </Badge>
                </div>
                
                {authResult.deviceInfo && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Dispositivo:</span>
                      <span className="text-sm font-medium flex items-center">
                        {authResult.deviceInfo.deviceType === 'MOBILE' ? (
                          <Smartphone className="h-3 w-3 mr-1" />
                        ) : (
                          <Monitor className="h-3 w-3 mr-1" />
                        )}
                        {authResult.deviceInfo.deviceType}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">ID:</span>
                      <span className="text-xs font-mono text-gray-500">
                        {authResult.deviceInfo.deviceId}
                      </span>
                    </div>
                  </div>
                )}
                
                {authResult.credentialId && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Credencial:</span>
                      <span className="text-xs font-mono text-gray-500">
                        {authResult.credentialId.substring(0, 8)}...
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>{authResult.error}</AlertDescription>
              </Alert>
            )}

            {authResult.warnings && authResult.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {authResult.warnings.join(", ")}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 