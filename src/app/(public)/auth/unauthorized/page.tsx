import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-600 p-3 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-red-600">Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-gray-600">
                Esta área requer permissões específicas que seu usuário não possui.
              </p>
              <p className="text-sm text-gray-500">
                Entre em contato com o administrador do sistema se acredita que isso é um erro.
              </p>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full" variant="outline">
                <Link href="/empresa/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Dashboard
                </Link>
              </Button>
              
              <Button asChild className="w-full">
                <Link href="/auth/signin">
                  <Shield className="h-4 w-4 mr-2" />
                  Fazer Login com Outro Usuário
                </Link>
              </Button>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center text-sm text-gray-500">
                <Shield className="h-4 w-4 mr-1" />
                Sistema de Controle de Acesso Ativo
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 