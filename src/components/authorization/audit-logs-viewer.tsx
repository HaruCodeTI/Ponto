'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Filter, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AuditLog } from '@/types/authorization';

interface AuditLogsViewerProps {
  logs: AuditLog[];
  onFilterChange?: (filters: any) => void;
  onExport?: () => void;
  isLoading?: boolean;
}

const actionColors = {
  'ACCESS_DENIED': 'bg-red-100 text-red-800',
  'LOGIN': 'bg-green-100 text-green-800',
  'LOGOUT': 'bg-gray-100 text-gray-800',
  'CREATE': 'bg-blue-100 text-blue-800',
  'UPDATE': 'bg-yellow-100 text-yellow-800',
  'DELETE': 'bg-red-100 text-red-800',
  'READ': 'bg-green-100 text-green-800',
  'EXPORT': 'bg-purple-100 text-purple-800',
  'ROLE_ACCESS_DENIED': 'bg-red-100 text-red-800',
  'SELF_ACCESS_DENIED': 'bg-orange-100 text-orange-800',
  'COMPANY_ACCESS_DENIED': 'bg-red-100 text-red-800',
};

const resourceLabels = {
  'employee': 'Funcionário',
  'time-record': 'Registro de Ponto',
  'report': 'Relatório',
  'settings': 'Configurações',
  'system': 'Sistema',
  'auth': 'Autenticação',
  'auth:2fa': '2FA',
  'auth:nfc': 'NFC',
  'auth:biometric': 'Biometria',
};

export function AuditLogsViewer({ logs, onFilterChange, onExport, isLoading }: AuditLogsViewerProps) {
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    resource: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    onFilterChange?.(filters);
  }, [filters, onFilterChange]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      action: '',
      resource: '',
      startDate: null,
      endDate: null,
    });
  };

  const getActionColor = (action: string) => {
    return actionColors[action as keyof typeof actionColors] || 'bg-gray-100 text-gray-800';
  };

  const getResourceLabel = (resource: string) => {
    return resourceLabels[resource as keyof typeof resourceLabels] || resource;
  };

  const formatDate = (date: Date) => {
    return format(date, "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
  };

  const uniqueActions = [...new Set(logs.map(log => log.action))];
  const uniqueResources = [...new Set(logs.map(log => log.resource))];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Busca */}
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por usuário, ação..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Ação */}
            <div>
              <Label htmlFor="action">Ação</Label>
              <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as ações</SelectItem>
                  {uniqueActions.map(action => (
                    <SelectItem key={action} value={action}>
                      <Badge className={getActionColor(action)} variant="secondary">
                        {action}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recurso */}
            <div>
              <Label htmlFor="resource">Recurso</Label>
              <Select value={filters.resource} onValueChange={(value) => handleFilterChange('resource', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os recursos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os recursos</SelectItem>
                  {uniqueResources.map(resource => (
                    <SelectItem key={resource} value={resource}>
                      {getResourceLabel(resource)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div>
              <Label>Período</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate && filters.endDate ? (
                      `${format(filters.startDate, 'dd/MM/yyyy')} - ${format(filters.endDate, 'dd/MM/yyyy')}`
                    ) : (
                      'Selecionar período'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: filters.startDate || undefined,
                      to: filters.endDate || undefined,
                    }}
                    onSelect={(range) => {
                      handleFilterChange('startDate', range?.from || null);
                      handleFilterChange('endDate', range?.to || null);
                      setIsCalendarOpen(false);
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
            <Button onClick={() => onExport?.()} disabled={isLoading}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-sm text-muted-foreground">Total de Logs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {logs.filter(log => log.action.includes('DENIED')).length}
            </div>
            <p className="text-sm text-muted-foreground">Acessos Negados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {logs.filter(log => log.action === 'LOGIN').length}
            </div>
            <p className="text-sm text-muted-foreground">Logins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {uniqueActions.length}
            </div>
            <p className="text-sm text-muted-foreground">Tipos de Ação</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoria</CardTitle>
          <CardDescription>
            Histórico de todas as ações realizadas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {formatDate(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.userEmail}</p>
                        <p className="text-xs text-muted-foreground">{log.userId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getResourceLabel(log.resource)}
                      {log.resourceId && (
                        <p className="text-xs text-muted-foreground">ID: {log.resourceId}</p>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm truncate" title={log.details}>
                        {log.details || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-mono">{log.ipAddress || '-'}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {logs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum log encontrado com os filtros aplicados.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 