"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, Shield } from "lucide-react";
import Link from "next/link";

function isStrongPassword(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const validate = () => {
    if (!password || !confirmPassword) {
      setError("Preencha todos os campos.");
      return false;
    }
    if (!isStrongPassword(password)) {
      setError("A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao redefinir senha.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/auth/signin"), 1500);
    } catch {
      setError("Erro ao redefinir senha. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="max-w-md w-full shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Token inválido</CardTitle>
            <CardDescription className="text-center">O link de redefinição é inválido ou expirou.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/auth/forgot-password" className="text-blue-600 underline">Solicitar novo link</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Redefinir Senha</h1>
          <p className="text-gray-600 mt-2">Crie uma nova senha forte para sua conta</p>
        </div>
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Nova Senha</CardTitle>
            <CardDescription className="text-center">
              Sua nova senha deve ser forte e segura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nova senha forte"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mb-2"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? "Ocultar senha" : "Mostrar senha"}
              </Button>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert variant="default">
                  <AlertDescription>Senha redefinida! Redirecionando...</AlertDescription>
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
                    Redefinindo...
                  </>
                ) : (
                  "Redefinir Senha"
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