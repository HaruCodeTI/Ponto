"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, Smartphone, Copy, CheckCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export default function TwoFactorSetupPage() {
  const [step, setStep] = useState<"setup" | "verify" | "success">("setup");
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const handleSetup = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setSetupData(data);
        setStep("verify");
      } else {
        setError(data.error || "Erro ao configurar 2FA.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep("success");
        toast.success("2FA configurado com sucesso!");
      } else {
        setError(data.error || "Token inválido.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-xl">2FA Configurado!</CardTitle>
            <CardDescription>
              Sua conta agora está protegida com autenticação de dois fatores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Importante:</strong> Guarde seus códigos de backup em um local seguro.
                Eles são necessários caso você perca acesso ao seu dispositivo.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => router.push("/empresa/dashboard")}
              className="w-full"
            >
              Ir para Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "verify" && setupData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Smartphone className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Configurar 2FA</CardTitle>
            <CardDescription>
              Escaneie o QR Code com seu app de autenticação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="text-center">
              <img
                src={setupData.qrCode}
                alt="QR Code para 2FA"
                className="mx-auto w-48 h-48"
              />
            </div>

            {/* Secret Manual */}
            <div className="space-y-2">
              <Label>Ou digite manualmente:</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={setupData.secret}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(setupData.secret)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Códigos de Backup */}
            <div className="space-y-2">
              <Label>Códigos de Backup (guarde em local seguro):</Label>
              <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                {setupData.backupCodes.map((code, index) => (
                  <div key={index} className="p-2 bg-gray-100 rounded">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            {/* Verificação */}
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Código de Verificação</Label>
                <Input
                  id="token"
                  type="text"
                  placeholder="000000"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  disabled={isLoading}
                  className="text-center text-lg font-mono"
                  maxLength={6}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isLoading || token.length !== 6}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar e Ativar 2FA"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Configurar 2FA</CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              A autenticação de dois fatores (2FA) adiciona uma camada extra de segurança.
              Você precisará de um app como Google Authenticator, Authy ou similar.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleSetup}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Configurando...
              </>
            ) : (
              "Iniciar Configuração"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 