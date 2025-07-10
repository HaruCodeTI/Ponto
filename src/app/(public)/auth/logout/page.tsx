"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, CheckCircle } from "lucide-react";

export default function LogoutPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOut({ redirect: false });
        setIsLoggedOut(true);
        
        // Redireciona para login após 2 segundos
        setTimeout(() => {
          router.push("/auth/signin");
        }, 2000);
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
        // Em caso de erro, redireciona mesmo assim
        router.push("/auth/signin");
      } finally {
        setIsLoggingOut(false);
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center">
              {isLoggedOut ? (
                <CheckCircle className="h-8 w-8 text-green-600 mr-2" />
              ) : (
                <LogOut className="h-8 w-8 text-blue-600 mr-2" />
              )}
              {isLoggedOut ? "Logout Realizado" : "Fazendo Logout"}
            </CardTitle>
            <CardDescription>
              {isLoggedOut 
                ? "Você foi desconectado com sucesso. Redirecionando..." 
                : "Aguarde enquanto desconectamos você do sistema..."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {isLoggingOut && (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-gray-600">Processando...</span>
              </div>
            )}
            
            {isLoggedOut && (
              <div className="space-y-4">
                <div className="text-green-600 text-sm">
                  ✓ Sessão encerrada com sucesso
                </div>
                <Button
                  onClick={() => router.push("/auth/signin")}
                  className="w-full"
                >
                  Ir para Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 