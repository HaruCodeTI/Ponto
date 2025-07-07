"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, CheckCircle, XCircle, Wifi } from "lucide-react";
import { simulateNFCScan } from "@/lib/nfc";
import { toast } from "sonner";

interface NFCReaderProps {
  onCardScanned?: (cardNumber: string) => void;
  onScanResult?: (result: { success: boolean; error?: string; cardNumber?: string; employeeId?: string; message?: string }) => void;
  autoScan?: boolean;
  className?: string;
}

export function NFCReader({ 
  onCardScanned, 
  onScanResult, 
  autoScan = false,
  className = "" 
}: NFCReaderProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ success: boolean; error?: string; cardNumber?: string; employeeId?: string; message?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setIsScanning(true);
    setError(null);

    try {
      // Simula delay de leitura
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const cardNumber = simulateNFCScan();
      setLastScan(cardNumber);

      // Processa o scan
      const response = await fetch("/api/auth/nfc/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNumber }),
      });

      const result = await response.json();
      setScanResult(result);

      if (result.success) {
        toast.success("Cartão NFC lido com sucesso!");
        onCardScanned?.(cardNumber);
        onScanResult?.(result);
      } else {
        setError(result.error || "Erro ao processar cartão");
        toast.error(result.error || "Erro ao processar cartão");
      }
    } catch {
      setError("Erro de conexão");
      toast.error("Erro de conexão");
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (autoScan) {
      const interval = setInterval(handleScan, 3000); // Scan a cada 3 segundos
      return () => clearInterval(interval);
    }
  }, [autoScan]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Leitor NFC
        </CardTitle>
        <CardDescription>
          Aproxime o cartão ou clique para simular leitura
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <Wifi className={`w-12 h-12 mx-auto mb-2 ${isScanning ? 'animate-pulse text-blue-500' : 'text-gray-400'}`} />
            <p className="text-sm text-gray-600">
              {isScanning ? "Lendo cartão..." : "Área de leitura NFC"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleScan}
            disabled={isScanning}
            className="flex-1"
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Lendo...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Simular Leitura
              </>
            )}
          </Button>
        </div>

        {lastScan && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Último cartão lido:</span>
              <Badge variant="outline" className="font-mono">
                {lastScan}
              </Badge>
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
                    {scanResult.employeeId && (
                      <div className="mt-1 text-sm">
                        Funcionário ID: {scanResult.employeeId}
                      </div>
                    )}
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
      </CardContent>
    </Card>
  );
} 