'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Database,
  FileText,
  Eye,
  Lock,
  Settings,
  Download,
  RefreshCw,
  Activity
  // BarChart3,
  // PieChart,
  // Calendar,
  // Filter,
  // Search
} from 'lucide-react';

interface AuditLog {
  id: string;
  companyId: string;
  userId?: string;
  employeeId?: string;
  sessionId?: string;
  action: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'PENDING' | 'CANCELLED';
  resourceType?: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  metadata: any;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  timestamp: Date;
  createdAt: Date;
}

interface SecurityAlert {
  id: string;
  companyId: string;
  type: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'FALSE_POSITIVE';
  title: string;
  description: string;
  source: string;
  metadata: any;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  criticalLogs: number;
  securityAlerts: number;
  openAlerts: number;
  complianceScore: number;
  dataRetentionCompliance: number;
  privacyConsentRate: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  topActions: Array<{
    action: string;
    count: number;
  }>;
  recentAlerts: SecurityAlert[];
  complianceIssues: Array<{
    type: string;
    count: number;
    severity: string;
  }>;
}

export function AuditDashboard() {
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, logsRes, alertsRes] = await Promise.all([
        fetch('/api/audit-logs/stats'),
        fetch('/api/audit-logs?limit=20'),
        fetch('/api/security-alerts?limit=10')
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (logsRes.ok) setLogs((await logsRes.json()).data);
      if (alertsRes.ok) setAlerts((await alertsRes.json()).data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/security-alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao reconhecer alerta:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/security-alerts/${alertId}/resolve`, {
        method: 'POST'
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-blue-100 text-blue-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800',
      INFO: 'bg-gray-100 text-gray-800'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SUCCESS: 'bg-green-100 text-green-800',
      FAILURE: 'bg-red-100 text-red-800',
      WARNING: 'bg-yellow-100 text-yellow-800',
      PENDING: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      OPEN: 'bg-red-100 text-red-800',
      ACKNOWLEDGED: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      RESOLVED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800',
      FALSE_POSITIVE: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      AUTHENTICATION: Shield,
      AUTHORIZATION: Lock,
      DATA_ACCESS: Eye,
      DATA_MODIFICATION: Database,
      SYSTEM_CONFIG: Settings,
      SECURITY: Shield,
      COMPLIANCE: CheckCircle,
      BACKUP_RESTORE: Database,
      REPORT_GENERATION: FileText,
      USER_MANAGEMENT: Users,
      EMPLOYEE_MANAGEMENT: Users,
      TIME_RECORD: Clock,
      PAYROLL: FileText,
      NOTIFICATION: Activity,
      API_ACCESS: Activity,
      FILE_OPERATION: FileText,
      DATABASE_OPERATION: Database,
      NETWORK_ACCESS: Activity,
      PRIVACY: Lock,
      OTHER: Settings
    };
    return icons[category] || Settings;
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Auditoria</h2>
          <p className="text-muted-foreground">
            Monitoramento avançado de segurança e compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.todayLogs} hoje
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas de Segurança</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.securityAlerts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.openAlerts} abertos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score de Compliance</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getComplianceScoreColor(stats.complianceScore)}`}>
                {stats.complianceScore}%
              </div>
              <Progress value={stats.complianceScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Críticos</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.criticalLogs}</div>
              <p className="text-xs text-muted-foreground">
                últimos 30 dias
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Compliance e Privacidade</CardTitle>
            <CardDescription>
              Status de conformidade com LGPD e políticas de retenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Retenção de Dados</span>
                <div className="flex items-center gap-2">
                  <Progress value={stats?.dataRetentionCompliance || 0} className="w-20" />
                  <span className="text-sm font-medium">{stats?.dataRetentionCompliance || 0}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Consentimento de Privacidade</span>
                <div className="flex items-center gap-2">
                  <Progress value={stats?.privacyConsentRate || 0} className="w-20" />
                  <span className="text-sm font-medium">{stats?.privacyConsentRate || 0}%</span>
                </div>
              </div>
              {stats?.complianceIssues.map((issue, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span className="text-sm text-red-700">{issue.type}</span>
                  <Badge className="bg-red-100 text-red-800">{issue.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Mais Frequentes</CardTitle>
            <CardDescription>
              Principais atividades registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topActions.slice(0, 5).map((action, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm truncate">{action.action}</span>
                  <Badge variant="outline">{action.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="logs">Logs de Auditoria</TabsTrigger>
          <TabsTrigger value="alerts">Alertas de Segurança</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Logs por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats && Object.entries(stats.byCategory).map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm">{category}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Logs por Severidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats && Object.entries(stats.bySeverity).map(([severity, count]) => (
                    <div key={severity} className="flex justify-between items-center">
                      <span className="text-sm">{severity}</span>
                      <Badge className={getSeverityColor(severity)}>{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Auditoria Recentes</CardTitle>
              <CardDescription>
                Últimas atividades registradas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.map((log) => {
                  const CategoryIcon = getCategoryIcon(log.category);
                  return (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="h-4 w-4" />
                          <span className="font-medium">{log.action}</span>
                          <Badge variant="outline">{log.category}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                          <Badge className={getStatusColor(log.status)}>
                            {log.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Usuário:</span>
                          <p className="font-medium">{log.userId || 'Sistema'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">IP:</span>
                          <p className="font-medium">{log.ipAddress || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Recurso:</span>
                          <p className="font-medium">{log.resourceType || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Data:</span>
                          <p className="font-medium">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Segurança</CardTitle>
              <CardDescription>
                Alertas ativos e recentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="font-medium">{alert.title}</span>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(alert.status)}>
                          {alert.status}
                        </Badge>
                        {alert.status === 'OPEN' && (
                          <>
                            <Button
                              onClick={() => acknowledgeAlert(alert.id)}
                              variant="outline"
                              size="sm"
                            >
                              Reconhecer
                            </Button>
                            <Button
                              onClick={() => resolveAlert(alert.id)}
                              variant="outline"
                              size="sm"
                            >
                              Resolver
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {alert.description}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Tipo:</span>
                        <p className="font-medium">{alert.type}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fonte:</span>
                        <p className="font-medium">{alert.source}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Criado:</span>
                        <p className="font-medium">
                          {new Date(alert.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Atualizado:</span>
                        <p className="font-medium">
                          {new Date(alert.updatedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Compliance</CardTitle>
              <CardDescription>
                Status de conformidade com regulamentações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className={`text-3xl font-bold ${getComplianceScoreColor(stats?.complianceScore || 0)}`}>
                      {stats?.complianceScore || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">Score Geral</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {stats?.dataRetentionCompliance || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">Retenção de Dados</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {stats?.privacyConsentRate || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">Consentimento LGPD</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Issues de Compliance</h4>
                  <div className="space-y-2">
                    {stats?.complianceIssues.map((issue, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <div>
                          <span className="font-medium text-red-700">{issue.type}</span>
                          <p className="text-sm text-red-600">Severidade: {issue.severity}</p>
                        </div>
                        <Badge className="bg-red-100 text-red-800">
                          {issue.count} ocorrências
                        </Badge>
                      </div>
                    ))}
                    {(!stats?.complianceIssues || stats.complianceIssues.length === 0) && (
                      <div className="text-center p-4 text-green-600">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>Nenhum issue de compliance encontrado</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 