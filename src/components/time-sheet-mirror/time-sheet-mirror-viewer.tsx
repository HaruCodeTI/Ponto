'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Download, CheckCircle, FileText, Calendar, Clock, AlertTriangle } from 'lucide-react';

interface TimeSheetMirror {
  id: string;
  employeeId: string;
  companyId: string;
  month: number;
  year: number;
  status: string;
  totalWorkHours: number;
  totalBreakHours: number;
  totalOvertimeHours: number;
  totalAbsences: number;
  totalDelays: number;
  workDays: number;
  totalDays: number;
  mirrorData: {
    employee: {
      id: string;
      name: string;
      registration: string;
      department?: string;
      position?: string;
    };
    company: {
      id: string;
      name: string;
      cnpj: string;
    };
    period: {
      month: number;
      year: number;
      startDate: Date;
      endDate: Date;
    };
    dailyRecords: Array<{
      date: Date;
      dayOfWeek: string;
      isWorkDay: boolean;
      isHoliday: boolean;
      isWeekend: boolean;
      records: {
        clockIn?: Date;
        breakStart?: Date;
        breakEnd?: Date;
        clockOut?: Date;
      };
      workHours: number;
      breakHours: number;
      overtimeHours: number;
      isAbsent: boolean;
      isDelayed: boolean;
      delayMinutes: number;
    }>;
    summary: {
      totalWorkHours: number;
      totalBreakHours: number;
      totalOvertimeHours: number;
      totalAbsences: number;
      totalDelays: number;
      workDays: number;
      totalDays: number;
      averageWorkHours: number;
      averageBreakHours: number;
    };
    compliance: {
      isCompliant: boolean;
      violations: string[];
      warnings: string[];
    };
  };
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface MirrorStats {
  totalMirrors: number;
  approvedMirrors: number;
  pendingMirrors: number;
  mirrorsByStatus: Record<string, number>;
  lastMirror: Date | null;
}

export function TimeSheetMirrorViewer() {
  const [mirrors, setMirrors] = useState<TimeSheetMirror[]>([]);
  const [stats, setStats] = useState<MirrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mirrors');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [mirrorsRes, statsRes] = await Promise.all([
        fetch('/api/time-sheet-mirror?limit=10'),
        fetch('/api/time-sheet-mirror/stats')
      ]);

      if (mirrorsRes.ok) setMirrors((await mirrorsRes.json()).data);
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMirror = async () => {
    try {
      const response = await fetch('/api/time-sheet-mirror', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: 'sample-employee-id',
          companyId: 'sample-company-id',
          month: selectedMonth,
          year: selectedYear
        })
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao gerar espelho:', error);
    }
  };

  const approveMirror = async (mirrorId: string) => {
    try {
      const response = await fetch('/api/time-sheet-mirror/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mirrorId })
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao aprovar espelho:', error);
    }
  };

  const exportMirror = (mirror: TimeSheetMirror) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Espelho de Ponto - ${mirror.mirrorData.employee.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
              .section { margin: 15px 0; }
              .label { font-weight: bold; }
              .value { margin-left: 10px; }
              .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .table th { background-color: #f2f2f2; }
              .summary { background-color: #f9f9f9; padding: 15px; margin: 20px 0; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>ESPELHO DE PONTO</h1>
              <h2>${mirror.mirrorData.company.name}</h2>
              <h3>${mirror.mirrorData.employee.name} - ${mirror.mirrorData.employee.registration}</h3>
              <p>Período: ${new Date(mirror.mirrorData.period.startDate).toLocaleDateString('pt-BR')} a ${new Date(mirror.mirrorData.period.endDate).toLocaleDateString('pt-BR')}</p>
            </div>
            
            <div class="summary">
              <h3>Resumo do Período</h3>
              <p><strong>Total de Horas Trabalhadas:</strong> ${mirror.totalWorkHours.toFixed(2)}h</p>
              <p><strong>Total de Horas de Intervalo:</strong> ${mirror.totalBreakHours.toFixed(2)}h</p>
              <p><strong>Total de Horas Extras:</strong> ${mirror.totalOvertimeHours.toFixed(2)}h</p>
              <p><strong>Dias Trabalhados:</strong> ${mirror.workDays} de ${mirror.totalDays}</p>
              <p><strong>Faltas:</strong> ${mirror.totalAbsences}</p>
              <p><strong>Atrasos:</strong> ${mirror.totalDelays}</p>
            </div>
            
            <table class="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Dia</th>
                  <th>Entrada</th>
                  <th>Início Intervalo</th>
                  <th>Fim Intervalo</th>
                  <th>Saída</th>
                  <th>Horas Trabalhadas</th>
                  <th>Horas Intervalo</th>
                  <th>Horas Extras</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${mirror.mirrorData.dailyRecords.map(record => `
                  <tr>
                    <td>${new Date(record.date).toLocaleDateString('pt-BR')}</td>
                    <td>${record.dayOfWeek}</td>
                    <td>${record.records.clockIn ? new Date(record.records.clockIn).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '-'}</td>
                    <td>${record.records.breakStart ? new Date(record.records.breakStart).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '-'}</td>
                    <td>${record.records.breakEnd ? new Date(record.records.breakEnd).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '-'}</td>
                    <td>${record.records.clockOut ? new Date(record.records.clockOut).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '-'}</td>
                    <td>${record.workHours.toFixed(2)}h</td>
                    <td>${record.breakHours.toFixed(2)}h</td>
                    <td>${record.overtimeHours.toFixed(2)}h</td>
                    <td>${getStatusLabel(record)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <p>Espelho gerado em: ${new Date(mirror.createdAt).toLocaleString('pt-BR')}</p>
              ${mirror.approvedAt ? `<p>Aprovado em: ${new Date(mirror.approvedAt).toLocaleString('pt-BR')}</p>` : ''}
              <p>Status: ${getStatusLabel(mirror.status)}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getStatusLabel = (item: any): string => {
    if (typeof item === 'string') {
      const labels: Record<string, string> = {
        DRAFT: 'Rascunho',
        GENERATED: 'Gerado',
        PENDING_APPROVAL: 'Pendente Aprovação',
        APPROVED: 'Aprovado',
        REJECTED: 'Rejeitado',
        EXPORTED: 'Exportado'
      };
      return labels[item] || item;
    }

    if (item.isAbsent) return 'Falta';
    if (item.isDelayed) return 'Atraso';
    if (item.isWeekend) return 'Fim de Semana';
    if (item.isHoliday) return 'Feriado';
    return 'Normal';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      GENERATED: 'bg-blue-100 text-blue-800',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      EXPORTED: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
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
          <h2 className="text-2xl font-bold">Espelho de Ponto Mensal</h2>
          <p className="text-muted-foreground">
            Geração, visualização e aprovação de espelhos de ponto
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-2">
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <SelectItem key={month} value={month.toString()}>
                    {getMonthName(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generateMirror} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Gerar Espelho
          </Button>
          <Button onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Espelhos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMirrors}</div>
              <p className="text-xs text-muted-foreground">
                espelhos gerados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedMirrors}</div>
              <p className="text-xs text-muted-foreground">
                de {stats.totalMirrors} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingMirrors}</div>
              <p className="text-xs text-muted-foreground">
                aguardando aprovação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Último Espelho</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.lastMirror ? new Date(stats.lastMirror).toLocaleDateString('pt-BR') : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                último gerado
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mirrors">Espelhos</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="mirrors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Espelhos Gerados</CardTitle>
              <CardDescription>
                Histórico de espelhos de ponto gerados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mirrors.map((mirror) => (
                  <div key={mirror.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">
                          {mirror.mirrorData.employee.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {getMonthName(mirror.month)}/{mirror.year}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(mirror.status)}>
                          {getStatusLabel(mirror.status)}
                        </Badge>
                        {mirror.status === 'PENDING_APPROVAL' && (
                          <Button
                            onClick={() => approveMirror(mirror.id)}
                            variant="outline"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar
                          </Button>
                        )}
                        <Button
                          onClick={() => exportMirror(mirror)}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Exportar
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Matrícula:</span>
                        <p className="font-medium">{mirror.mirrorData.employee.registration}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Horas Trabalhadas:</span>
                        <p className="font-medium">{mirror.totalWorkHours.toFixed(2)}h</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Horas Extras:</span>
                        <p className="font-medium">{mirror.totalOvertimeHours.toFixed(2)}h</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dias Trabalhados:</span>
                        <p className="font-medium">{mirror.workDays}/{mirror.totalDays}</p>
                      </div>
                    </div>
                    {mirror.mirrorData.compliance.violations.length > 0 && (
                      <div className="text-sm text-red-600 mt-2">
                        <strong>Violações:</strong> {mirror.mirrorData.compliance.violations.join(', ')}
                      </div>
                    )}
                    {mirror.mirrorData.compliance.warnings.length > 0 && (
                      <div className="text-sm text-yellow-600 mt-2">
                        <strong>Avisos:</strong> {mirror.mirrorData.compliance.warnings.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas por Status</CardTitle>
              <CardDescription>
                Distribuição de espelhos por status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.mirrorsByStatus && (
                <div className="space-y-4">
                  {Object.entries(stats.mirrorsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="font-medium">{getStatusLabel(status)}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 