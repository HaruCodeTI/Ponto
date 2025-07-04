import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  CheckCircle, 
  AlertTriangle,
  Wifi
} from "lucide-react";

export default function ComoFuncionaNFC() {
  return (
    <main className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-bold mb-2 text-center">Como funciona a autenticação por NFC (Crachá Digital)</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <CreditCard className="h-5 w-5 mr-2" />
            O que é o NFC Reader?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            O <strong>NFC Reader</strong> é um componente que permite autenticar funcionários por aproximação de crachás digitais (NFC) em dispositivos compatíveis. Ele simula a leitura de um crachá, valida permissões, status e registra o ponto de forma segura e auditável.
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-700">
            <li>Detecta se o dispositivo suporta NFC (Web NFC API ou nativo)</li>
            <li>Simula leitura do crachá (mock para ambiente web, pronto para integração real)</li>
            <li>Valida status, expiração, permissões e uso do crachá</li>
            <li>Autentica o funcionário e registra o ponto</li>
            <li>Exibe feedback visual: progresso, status, erros, permissões, dados do crachá e funcionário</li>
            <li>Gera logs de auditoria para cada leitura/autenticação</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Wifi className="h-5 w-5 mr-2 text-blue-600" />
            Como será integrado ao sistema?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            O componente <strong>NFCReader</strong> será utilizado em páginas como <Badge variant="outline">/nfc</Badge> e poderá ser integrado ao fluxo de bater ponto (web/mobile) como alternativa de autenticação rápida e segura.
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-700">
            <li>Interface touch-friendly, responsiva e acessível</li>
            <li>Feedback visual em tempo real (progresso, status, erros, sucesso)</li>
            <li>Exibe informações do crachá, permissões, status, tempo restante, funcionário autenticado e hash do registro</li>
            <li>Suporte a dispositivos sem NFC (mensagem clara e fallback)</li>
            <li>Pronto para integração real com Web NFC API (basta trocar a função de leitura)</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Benefícios da autenticação por NFC
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="list-disc pl-5 text-sm text-gray-700">
            <li>Registro de ponto instantâneo e sem contato</li>
            <li>Reduz fraudes e aumenta a segurança</li>
            <li>Permite controle de acesso a áreas restritas</li>
            <li>Gera logs de auditoria detalhados</li>
            <li>Experiência moderna e prática para o usuário</li>
          </ul>
        </CardContent>
      </Card>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> No ambiente web, a leitura NFC é simulada (mock). Em produção, basta integrar com a Web NFC API ou hardware compatível para leitura real.
        </AlertDescription>
      </Alert>

      <div className="text-center mt-6">
        <Badge variant="default">Próximo passo: Implementação do NFCReader</Badge>
      </div>
    </main>
  );
} 