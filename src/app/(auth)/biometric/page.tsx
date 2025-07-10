import React from "react";
import { BiometricAuth } from "@/components/biometric/biometric-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Fingerprint, 
  Info, 
  ArrowLeft,
  Smartphone,
  Shield
} from "lucide-react";
import Link from "next/link";

export default function BiometricPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Link href="/bater-ponto">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-bold flex items-center">
            <Fingerprint className="h-8 w-8 mr-3 text-blue-600" />
            Teste de Biometria
          </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Teste a autenticação biométrica em seu dispositivo. 
          Esta funcionalidade simula o processo de autenticação para demonstração.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Componente de Autenticação */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                Autenticação Biométrica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BiometricAuth employeeId="1" />
            </CardContent>
          </Card>
        </div>

        {/* Informações e Instruções */}
        <div className="space-y-6">
          {/* Status do Dispositivo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Info className="h-5 w-5 mr-2 text-blue-600" />
                Status do Dispositivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tipo:</span>
                <div className="flex items-center">
                  <Smartphone className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Mobile</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Biometria:</span>
                <Badge variant="outline" className="text-xs">
                  Suportada
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">WebAuthn:</span>
                <Badge variant="outline" className="text-xs">
                  Disponível
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Instruções */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Como Usar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-600">
                  Clique no botão "Autenticar" para iniciar o processo
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-600">
                  Use o método biométrico disponível no seu dispositivo
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-600">
                  Aguarde a validação e confirmação do resultado
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-600">
                  Veja os detalhes da autenticação no resultado
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Métodos Suportados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Métodos Suportados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Digital</span>
                <Badge variant="secondary" className="text-xs">
                  Mobile
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Face ID</span>
                <Badge variant="secondary" className="text-xs">
                  Mobile/Desktop
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">WebAuthn</span>
                <Badge variant="secondary" className="text-xs">
                  Desktop
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">PIN</span>
                <Badge variant="secondary" className="text-xs">
                  Todos
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Links Úteis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Links Úteis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="link" className="p-0 h-auto text-sm">
                <Link href="/biometric/como-funciona">
                  Como funciona a biometria
                </Link>
              </Button>
              <Button asChild variant="link" className="p-0 h-auto text-sm">
                <Link href="/bater-ponto">
                  Voltar ao ponto
                </Link>
              </Button>
              <Button asChild variant="link" className="p-0 h-auto text-sm">
                <Link href="/bater-ponto-mobile">
                  Versão mobile
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Nota de Demonstração */}
      <Card className="mt-8 bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">
                Modo Demonstração
              </h3>
              <p className="text-sm text-yellow-700">
                Esta é uma simulação da autenticação biométrica para fins de demonstração. 
                Em produção, seria integrada com as APIs nativas do dispositivo e WebAuthn 
                para autenticação real.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 