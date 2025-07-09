import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoleManager } from '@/components/authorization/role-manager';
import { AuditLogsViewer } from '@/components/authorization/audit-logs-viewer';
import { Shield, Users, FileText, Settings } from 'lucide-react';

export default function AuthorizationPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Sistema de Autorização</h1>
          <p className="text-muted-foreground">
            Gerencie permissões, roles e monitore acessos ao sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Auditoria
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissões
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-6">
          <Suspense fallback={<div>Carregando...</div>}>
            <RoleManager 
              users={[]} // Será carregado via API
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Suspense fallback={<div>Carregando...</div>}>
            <AuditLogsViewer 
              logs={[]} // Será carregado via API
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Permissões</CardTitle>
              <CardDescription>
                Visão detalhada das permissões por role e recurso do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Recurso/Ação</th>
                      <th className="text-center p-2">Administrador</th>
                      <th className="text-center p-2">Gerente</th>
                      <th className="text-center p-2">Funcionário</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Funcionários - Criar</td>
                      <td className="text-center p-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mx-auto" />
                      </td>
                      <td className="text-center p-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mx-auto" />
                      </td>
                      <td className="text-center p-2">
                        <div className="w-2 h-2 bg-gray-300 rounded-full mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Funcionários - Ler</td>
                      <td className="text-center p-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mx-auto" />
                      </td>
                      <td className="text-center p-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mx-auto" />
                      </td>
                      <td className="text-center p-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Registro de Ponto - Criar</td>
                      <td className="text-center p-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mx-auto" />
                      </td>
                      <td className="text-center p-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mx-auto" />
                      </td>
                      <td className="text-center p-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Registro de Ponto - Ajustar</td>
                      <td className="text-center p-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mx-auto" />
                      </td>
                      <td className="text-center p-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mx-auto" />
                      </td>
                      <td className="text-center p-2">
                        <div className="w-2 h-2 bg-gray-300 rounded-full mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Relatórios - Gerar</td>
                      <td className="text-center p-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mx-auto" />
                      </td>
                      <td className="text-center p-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mx-auto" />
                      </td>
                      <td className="text-center p-2">
                        <div className="w-2 h-2 bg-gray-300 rounded-full mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Sistema - Logs</td>
                      <td className="text-center p-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mx-auto" />
                      </td>
                      <td className="text-center p-2">
                        <div className="w-2 h-2 bg-gray-300 rounded-full mx-auto" />
                      </td>
                      <td className="text-center p-2">
                        <div className="w-2 h-2 bg-gray-300 rounded-full mx-auto" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Auditoria</CardTitle>
                <CardDescription>
                  Configure o comportamento do sistema de auditoria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Retenção de Logs</label>
                  <select className="w-full p-2 border rounded">
                    <option>30 dias</option>
                    <option>60 dias</option>
                    <option>90 dias</option>
                    <option>1 ano</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nível de Log</label>
                  <select className="w-full p-2 border rounded">
                    <option>Básico</option>
                    <option>Detalhado</option>
                    <option>Completo</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações de Sessão</CardTitle>
                <CardDescription>
                  Configure o comportamento das sessões de usuário
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tempo de Sessão</label>
                  <select className="w-full p-2 border rounded">
                    <option>30 minutos</option>
                    <option>1 hora</option>
                    <option>4 horas</option>
                    <option>8 horas</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sessões Simultâneas</label>
                  <select className="w-full p-2 border rounded">
                    <option>1 sessão</option>
                    <option>2 sessões</option>
                    <option>3 sessões</option>
                    <option>Ilimitado</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 