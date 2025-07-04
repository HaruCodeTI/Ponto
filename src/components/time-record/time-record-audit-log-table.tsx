"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Clock, 
  User, 
  Smartphone, 
  Monitor, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Fingerprint,
  CreditCard,
  Shield
} from "lucide-react";
import { 
  TimeRecordAuditLog, 
  AuditLogFilters, 
  AuditLogResponse,
  AuthenticationMethod,
  AttemptStatus,
  AuditLogStats
} from "@/types/time-record";
import { queryAuditLogs, getAuditLogStats } from "@/lib/time-record";

interface TimeRecordAuditLogTableProps {
  companyId?: string;
  employeeId?: string;
  userId?: string;
  showFilters?: boolean;
  showStats?: boolean;
  limit?: number;
}

export function TimeRecordAuditLogTable({
  companyId,
  employeeId,
  userId,
  showFilters = true,
  showStats = true,
  limit = 20,
}: TimeRecordAuditLogTableProps) {
  const [logs, setLogs] = useState<TimeRecordAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [selectedLog, setSelectedLog] = useState<TimeRecordAuditLog | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({
    companyId,
    employeeId,
    userId,
    limit,
  });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response: AuditLogResponse = await queryAuditLogs(filters);
      setLogs(response.logs);
      
      if (showStats) {
        const statsData = await getAuditLogStats(filters);
        setStats(statsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar logs");
    } finally {
      setLoading(false);
    }
  }, [filters, showStats]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getStatusIcon = (status: AttemptStatus) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
      case 'AUTH_FAILED':
      case 'INVALID_LOCATION':
      case 'INVALID_DEVICE':
      case 'INVALID_TIME':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'TIMEOUT':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMethodIcon = (method?: AuthenticationMethod) => {
    switch (method) {
      case 'BIOMETRIC':
      case 'FACE_ID':
      case 'FINGERPRINT':
        return <Fingerprint className="h-4 w-4" />;
      case 'NFC':
        return <CreditCard className="h-4 w-4" />;
      case 'MANUAL':
        return <User className="h-4 w-4" />;
      case 'WEBAUTHN':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'MOBILE':
        return <Smartphone className="h-4 w-4" />;
      case 'DESKTOP':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: AttemptStatus) => {
    switch (status) {
      case 'SUCCESS':
        return 'default';
      case 'FAILED':
      case 'AUTH_FAILED':
      case 'INVALID_LOCATION':
      case 'INVALID_DEVICE':
      case 'INVALID_TIME':
        return 'destructive';
      case 'PENDING':
        return 'secondary';
      case 'TIMEOUT':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '-';
    return `${duration}ms`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando logs de auditoria...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {showStats && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Estatísticas de Auditoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalAttempts}</div>
                <div className="text-sm text-gray-600">Total de Tentativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.successfulAttempts}</div>
                <div className="text-sm text-gray-600">Sucessos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.failedAttempts}</div>
                <div className="text-sm text-gray-600">Falhas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.successRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Taxa de Sucesso</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as AttemptStatus || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="SUCCESS">Sucesso</SelectItem>
                    <SelectItem value="FAILED">Falha</SelectItem>
                    <SelectItem value="INVALID_LOCATION">Localização Inválida</SelectItem>
                    <SelectItem value="AUTH_FAILED">Falha na Autenticação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Método</label>
                <Select
                  value={filters.authenticationMethod || ''}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, authenticationMethod: value as AuthenticationMethod || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os métodos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="NFC">NFC</SelectItem>
                    <SelectItem value="BIOMETRIC">Biometria</SelectItem>
                    <SelectItem value="FACE_ID">Face ID</SelectItem>
                    <SelectItem value="FINGERPRINT">Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Dispositivo</label>
                <Select
                  value={filters.deviceType || ''}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, deviceType: value as 'MOBILE' | 'DESKTOP' | 'TERMINAL' || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os dispositivos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="MOBILE">Mobile</SelectItem>
                    <SelectItem value="DESKTOP">Desktop</SelectItem>
                    <SelectItem value="TERMINAL">Terminal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end space-x-2">
                <Button onClick={loadLogs} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Atualizar
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoria ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{log.employeeId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getMethodIcon(log.authenticationMethod)}
                        <Badge variant="outline" className="text-xs">
                          {log.authenticationMethod || 'MANUAL'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(log.status)}
                        <Badge variant={getStatusBadgeVariant(log.status)} className="text-xs">
                          {log.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getDeviceIcon(log.deviceInfo.deviceType)}
                        <span className="text-sm">{log.deviceInfo.deviceType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatDuration(log.metadata?.duration)}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Detalhes do Log de Auditoria</DialogTitle>
                          </DialogHeader>
                          {selectedLog && <LogDetails log={selectedLog} />}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {logs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum log de auditoria encontrado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para exibir detalhes do log
function LogDetails({ log }: { log: TimeRecordAuditLog }) {
  return (
    <div className="space-y-4">
      {/* Informações básicas */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600">ID do Log</label>
          <p className="text-sm font-mono">{log.id}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Data/Hora</label>
          <p className="text-sm">{new Date(log.timestamp).toLocaleString('pt-BR')}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Ação</label>
          <p className="text-sm">{log.action}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Status</label>
          <Badge variant={log.status === 'SUCCESS' ? 'default' : 'destructive'}>
            {log.status}
          </Badge>
        </div>
      </div>

      {/* Detalhes de autenticação */}
      {log.authenticationDetails && (
        <div>
          <h4 className="font-medium mb-2">Detalhes de Autenticação</h4>
          <div className="bg-gray-50 p-3 rounded-md space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Método:</span>
              <span className="text-sm font-medium">{log.authenticationDetails.method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Sucesso:</span>
              <Badge variant={log.authenticationDetails.success ? 'default' : 'destructive'}>
                {log.authenticationDetails.success ? 'Sim' : 'Não'}
              </Badge>
            </div>
            {log.authenticationDetails.error && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Erro:</span>
                <span className="text-sm text-red-600">{log.authenticationDetails.error}</span>
              </div>
            )}
            {log.authenticationDetails.credentialId && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Credencial:</span>
                <span className="text-sm font-mono">{log.authenticationDetails.credentialId}</span>
              </div>
            )}
            {log.authenticationDetails.cardNumber && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Crachá:</span>
                <span className="text-sm font-mono">{log.authenticationDetails.cardNumber}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Localização */}
      {log.location && (
        <div>
          <h4 className="font-medium mb-2">Localização</h4>
          <div className="bg-gray-50 p-3 rounded-md space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Latitude:</span>
              <span className="text-sm font-mono">{log.location.latitude}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Longitude:</span>
              <span className="text-sm font-mono">{log.location.longitude}</span>
            </div>
            {log.location.address && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Endereço:</span>
                <span className="text-sm">{log.location.address}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dispositivo */}
      <div>
        <h4 className="font-medium mb-2">Informações do Dispositivo</h4>
        <div className="bg-gray-50 p-3 rounded-md space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Tipo:</span>
            <span className="text-sm">{log.deviceInfo.deviceType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">ID:</span>
            <span className="text-sm font-mono">{log.deviceInfo.deviceId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Plataforma:</span>
            <span className="text-sm">{log.deviceInfo.platform}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Fuso Horário:</span>
            <span className="text-sm">{log.deviceInfo.timezone}</span>
          </div>
          {log.deviceInfo.screenResolution && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Resolução:</span>
              <span className="text-sm">{log.deviceInfo.screenResolution}</span>
            </div>
          )}
        </div>
      </div>

      {/* Validações */}
      {log.validations && (
        <div>
          <h4 className="font-medium mb-2">Validações</h4>
          <div className="bg-gray-50 p-3 rounded-md space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Localização:</span>
              <Badge variant={log.validations.location.isValid ? 'default' : 'destructive'}>
                {log.validations.location.isValid ? 'Válida' : 'Inválida'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Dispositivo:</span>
              <Badge variant={log.validations.device.isValid ? 'default' : 'destructive'}>
                {log.validations.device.isValid ? 'Válido' : 'Inválido'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Horário:</span>
              <Badge variant={log.validations.time.isValid ? 'default' : 'destructive'}>
                {log.validations.time.isValid ? 'Válido' : 'Inválido'}
              </Badge>
            </div>
            {log.validations.errors.length > 0 && (
              <div>
                <span className="text-sm text-gray-600">Erros:</span>
                <ul className="text-sm text-red-600 mt-1">
                  {log.validations.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadados */}
      <div>
        <h4 className="font-medium mb-2">Metadados</h4>
        <div className="bg-gray-50 p-3 rounded-md space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Duração:</span>
            <span className="text-sm font-mono">{log.metadata?.duration}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Sessão:</span>
            <span className="text-sm font-mono">{log.metadata?.sessionId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Requisição:</span>
            <span className="text-sm font-mono">{log.metadata?.requestId}</span>
          </div>
          {log.metadata?.retryCount && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tentativas:</span>
              <span className="text-sm">{log.metadata.retryCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Detalhes */}
      <div>
        <h4 className="font-medium mb-2">Detalhes</h4>
        <p className="text-sm bg-gray-50 p-3 rounded-md">{log.details}</p>
      </div>

      {/* Avisos */}
      {log.warnings && log.warnings.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Avisos</h4>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="mt-1">
                {log.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
} 