"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Copy, 
  Check, 
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { 
  VerificationCode, 
  VerificationResult,
  generateReadableCode, 
  generateVerificationQRCode,
  verifyRecordIntegrity,
  DEFAULT_HASH_CONFIG
} from "@/lib/hash-verification";
import { TimeRecord } from "@/types/time-record";

interface VerificationCodeProps {
  timeRecord: TimeRecord;
  verificationCode: VerificationCode;
  onVerify?: (result: VerificationResult) => void;
}

export function VerificationCodeDisplay({ 
  timeRecord, 
  verificationCode, 
  onVerify 
}: VerificationCodeProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const readableCode = generateReadableCode(verificationCode);
  const qrCodeData = generateVerificationQRCode(verificationCode);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Erro ao copiar:", error);
    }
  };

  const verifyIntegrity = async () => {
    setIsVerifying(true);
    try {
      const result = verifyRecordIntegrity(timeRecord, verificationCode, DEFAULT_HASH_CONFIG);
      setVerificationResult(result);
      onVerify?.(result);
    } catch (error) {
      console.error("Erro ao verificar integridade:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <div>
              <CardTitle className="text-lg">Código de Verificação</CardTitle>
              <CardDescription>
                Registro #{timeRecord.id} - {new Date(timeRecord.timestamp).toLocaleString('pt-BR')}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {!verificationResult ? "Não Verificado" : 
               verificationResult.isValid ? "Válido" : "Inválido"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Código Legível */}
        <div>
          <h4 className="font-medium mb-2">Código de Verificação</h4>
          <div className="flex items-center gap-2">
            <code className="bg-gray-100 px-3 py-2 rounded-md font-mono text-sm flex-1">
              {readableCode}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(readableCode)}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* QR Code */}
        <div>
          <h4 className="font-medium mb-2">QR Code para Verificação</h4>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center justify-between">
              <code className="text-xs break-all font-mono flex-1">
                {qrCodeData}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(qrCodeData)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Escaneie este código para verificar a autenticidade do registro
          </p>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            onClick={verifyIntegrity}
            disabled={isVerifying}
            className="flex-1"
          >
            {isVerifying ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Shield className="w-4 h-4 mr-2" />
            )}
            Verificar Integridade
          </Button>
        </div>

        {/* Resultado da Verificação */}
        {verificationResult && (
          <div>
            <Separator />
            <h4 className="font-medium mb-2 mt-4">Resultado da Verificação</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Integridade:</span>
                {verificationResult.integrity ? 
                  <CheckCircle className="w-4 h-4 text-green-600" /> : 
                  <XCircle className="w-4 h-4 text-red-600" />
                }
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Autenticidade:</span>
                {verificationResult.authenticity ? 
                  <CheckCircle className="w-4 h-4 text-green-600" /> : 
                  <XCircle className="w-4 h-4 text-red-600" />
                }
              </div>
            </div>

            {verificationResult.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Avisos:</strong> {verificationResult.warnings.join(', ')}
                </AlertDescription>
              </Alert>
            )}

            {verificationResult.errors.length > 0 && (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Erros:</strong> {verificationResult.errors.join(', ')}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Detalhes Técnicos */}
        {showDetails && (
          <div>
            <Separator />
            <h4 className="font-medium mb-2 mt-4">Detalhes Técnicos</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Hash:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {verificationCode.hash.substring(0, 16)}...
                </code>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Algoritmo:</span>
                <span>{verificationCode.metadata.algorithm}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Versão:</span>
                <span>{verificationCode.version}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 