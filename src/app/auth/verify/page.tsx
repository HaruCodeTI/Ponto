"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

function VerifyInner() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const verifyToken = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message || "Email verificado com sucesso!");
      } else {
        setStatus("error");
        setMessage(data.error || "Erro ao verificar email.");
      }
    } catch {
      setStatus("error");
      setMessage("Erro de conexão. Tente novamente.");
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de verificação não encontrado.");
      return;
    }

    verifyToken();
  }, [token, verifyToken]);

  const getStatusContent = () => {
    switch (status) {
      case "loading":
        return (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-xl">Verificando Email...</CardTitle>
            <CardDescription>
              Aguarde enquanto verificamos seu token de verificação.
            </CardDescription>
          </>
        );

      case "success":
        return (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-xl">Email Verificado!</CardTitle>
            <CardDescription>
              Seu email foi verificado com sucesso. Agora você pode fazer login.
            </CardDescription>
          </>
        );

      case "error":
        return (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Erro na Verificação</CardTitle>
            <CardDescription>
              Não foi possível verificar seu email. Tente novamente.
            </CardDescription>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {getStatusContent()}
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant={status === "success" ? "default" : "destructive"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            {status === "success" && (
              <Button
                onClick={() => router.push("/auth/signin")}
                className="w-full"
              >
                Ir para Login
              </Button>
            )}

            {status === "error" && (
              <>
                <Button
                  onClick={() => router.push("/auth/verify-email")}
                  className="w-full"
                >
                  Solicitar Novo Email
                </Button>
                <Button
                  onClick={() => router.push("/auth/signin")}
                  variant="outline"
                  className="w-full"
                >
                  Voltar para Login
                </Button>
              </>
            )}

            {status === "loading" && (
              <div className="text-center text-sm text-gray-500">
                Verificando...
              </div>
            )}
          </div>

          <div className="text-center">
            <Link
              href="/auth/signin"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Voltar para Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <VerifyInner />
    </Suspense>
  );
} 