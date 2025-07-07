"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Smartphone, Settings } from "lucide-react";
// import { useSession } from "next-auth/react"; // Removido pois não está sendo usado
// import { toast } from "sonner"; // Removido pois não está sendo usado
import Link from "next/link";

interface TwoFactorStatus {
  enabled: boolean;
  setupComplete: boolean;
}

export function TwoFactorManager() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const { data: session } = useSession(); // Removido pois não está sendo usado

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/auth/2fa/status");
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Erro ao carregar status 2FA:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Autenticação de Dois Fatores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Autenticação de Dois Fatores
        </CardTitle>
        <CardDescription>
          Adicione uma camada extra de segurança à sua conta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status?.enabled ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-green-600" />
                <span className="font-medium">Status</span>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Ativado
              </Badge>
            </div>
            
            <Alert>
              <AlertDescription>
                Sua conta está protegida com autenticação de dois fatores.
                Você precisará de um código do seu app de autenticação para fazer login.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/auth/2fa/setup">
                  <Settings className="w-4 h-4 mr-2" />
                  Reconfigurar
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-gray-600" />
                <span className="font-medium">Status</span>
              </div>
              <Badge variant="secondary">
                Desativado
              </Badge>
            </div>
            
            <Alert>
              <AlertDescription>
                A autenticação de dois fatores adiciona uma camada extra de segurança.
                Recomendamos ativar para proteger sua conta.
              </AlertDescription>
            </Alert>

            <Button asChild>
              <Link href="/auth/2fa/setup">
                <Shield className="w-4 h-4 mr-2" />
                Configurar 2FA
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
} 