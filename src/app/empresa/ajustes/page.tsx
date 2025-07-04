import { AdjustmentManager } from "@/components/time-record/adjustment-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, FileText, Clock, CheckCircle } from "lucide-react";

export default function AjustesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Ajustes de Registros</h1>
        <p className="text-gray-600">
          Gerencie solicitações de ajuste de registros de ponto com controle de compliance
        </p>
      </div>

      {/* Informações sobre imutabilidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Registros Imutáveis
          </CardTitle>
          <CardDescription>
            Sistema de compliance para garantir integridade dos dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Justificativa Obrigatória</p>
                <p className="text-sm text-gray-600">Toda alteração requer motivação</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Aprovação Hierárquica</p>
                <p className="text-sm text-gray-600">Gestores aprovam alterações</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Trilha de Auditoria</p>
                <p className="text-sm text-gray-600">Histórico completo de mudanças</p>
              </div>
            </div>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Compliance:</strong> Este sistema garante que todos os registros de ponto 
              sejam imutáveis por padrão, permitindo ajustes apenas através de processo 
              controlado com justificativas e aprovações.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">3</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aprovados</p>
                <p className="text-2xl font-bold text-green-600">12</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejeitados</p>
                <p className="text-2xl font-bold text-red-600">2</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">17</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gerenciador de Ajustes */}
      <AdjustmentManager 
        companyId="current_company" // Em produção, seria obtido do contexto
      />
    </div>
  );
} 