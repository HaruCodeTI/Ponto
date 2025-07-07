"use client";

import React, { useState } from "react";
// import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Shield } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  // const router = useRouter(); // Removido pois não está sendo usado

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!email) {
      setError("Informe seu email.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setError("Erro ao solicitar recuperação. Tente novamente.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Erro ao solicitar recuperação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Mail className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Recuperar Senha</h1>
          <p className="text-gray-600 mt-2">Informe seu email para receber o link de redefinição</p>
        </div>
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Esqueceu a senha?</CardTitle>
            <CardDescription className="text-center">
              Enviaremos um link para redefinir sua senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert variant="default">
                  <AlertDescription>
                    Se o email existir, você receberá um link para redefinir sua senha.
                  </AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar link de redefinição"
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Link
                href="/auth/signin"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Voltar ao login
              </Link>
            </div>
          </CardContent>
        </Card>
        <div className="text-center mt-8">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Shield className="h-4 w-4 mr-1" />
            Sistema seguro e em conformidade com a legislação
          </div>
        </div>
      </div>
    </div>
  );
} 