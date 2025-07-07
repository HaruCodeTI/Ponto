"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { Loader2, Fingerprint, Eye, Mic, CheckCircle, XCircle } from "lucide-react";
import { simulateBiometricScan } from "@/lib/biometric";
import { toast } from "sonner";

interface BiometricAuthProps {
  employeeId: string;
  onAuthSuccess?: (result: { success: boolean; employeeId?: string; type?: string; message?: string; error?: string }) => void;
  onAuthError?: (error: string) => void;
  className?: string;
}

const BIOMETRIC_TYPES = [
  { type: 'FINGERPRINT', label: 'Digital', icon: Fingerprint, color: 'text-blue-600' },
  { type: 'FACE', label: 'Reconhecimento Facial', icon: Eye, color: 'text-green-600' },
  { type: 'VOICE', label: 'Voz', icon: Mic, color: 'text-purple-600' },
] as const;

export function BiometricAuth({ 
  employeeId, 
  onAuthSuccess, 
  onAuthError,
  className = "" 
}: BiometricAuthProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ success: boolean; employeeId?: string; type?: string; message?: string; error?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (type: string) => {
    setIsScanning(true);
    setError(null);
    setSelectedType(type);

    try {
      // Simula delay de leitura
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      simulateBiometricScan(type as any);

      // Processa o scan
      const response = await fetch("/api/auth/biometric/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, type }),
      });

      const result = await response.json();
      setScanResult(result);

      if (result.success) {
        toast.success("Autenticação biométrica realizada com sucesso!");
        onAuthSuccess?.(result);
      } else {
        setError(result.error || "Erro na autenticação biométrica");
        toast.error(result.error || "Erro na autenticação biométrica");
        onAuthError?.(result.error || "Erro na autenticação biométrica");
      }
    } catch {
      const errorMsg = "Erro de conexão";
      setError(errorMsg);
      toast.error(errorMsg);
      onAuthError?.(errorMsg);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="w-5 h-5" />
          Autenticação Biométrica
        </CardTitle>
        <CardDescription>
          Escolha o método de autenticação biométrica
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {BIOMETRIC_TYPES.map(({ type, label, icon: Icon, color }) => (
            <Button
              key={type}
              variant="outline"
              className={`h-20 flex flex-col items-center justify-center gap-2 ${
                selectedType === type && isScanning ? 'border-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => handleScan(type)}
              disabled={isScanning}
            >
              <Icon className={`w-6 h-6 ${color}`} />
              <span className="text-sm">{label}</span>
              {isScanning && selectedType === type && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
            </Button>
          ))}
        </div>

        {isScanning && (
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm text-gray-600">
                Processando {selectedType?.toLowerCase()}...
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}

        {scanResult && (
          <Alert variant={scanResult.success ? "default" : "destructive"}>
            <div className="flex items-center gap-2">
              {scanResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {scanResult.success ? (
                  <>
                    <strong>Sucesso!</strong> {scanResult.message}
                    <div className="mt-1 text-sm">
                      Tipo: {scanResult.type} | Funcionário ID: {scanResult.employeeId}
                    </div>
                  </>
                ) : (
                  <>
                    <strong>Erro:</strong> {scanResult.error}
                  </>
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-gray-500 text-center">
          <p>Esta é uma simulação. Em produção, seria integrado com hardware biométrico real.</p>
        </div>
      </CardContent>
    </Card>
  );
} 