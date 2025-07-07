'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, Download, FileText, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

interface AFDExport {
  id: string;
  companyId: string;
  employeeId?: string;
  startDate: Date;
  endDate: Date;
  fileName: string;
  filePath: string;
  fileSize: number;
  recordCount: number;
  status: string;
  afdVersion: string;
  checksum: string;
  metadata: {
    company: {
      id: string;
      name: string;
      cnpj: string;
      cei?: string;
    };
    employee?: {
      id: string;
      name: string;
      pis: string;
      registration: string;
    };
    period: {
      startDate: Date;
      endDate: Date;
      totalDays: number;
    };
    records: {
      total: number;
      clockIn: number;
      clockOut: number;
      breakStart: number;
      breakEnd: number;
      adjustments: number;
    };
    compliance: {
      isCompliant: boolean;
      violations: string[];
      warnings: string[];
    };
    export: {
      version: string;
      format: string;
      encoding: string;
      generatedAt: Date;
      expiresAt: Date;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

interface AFDStats {
  totalExports: number;
  completedExports: number;
  failedExports: number;
  totalRecords: number;
  lastExport: Date | null;
}

export function AFDExportViewer() {
  const [exports, setExports] = useState<AFDExport[]>([]);
  const [stats, setStats] = useState<AFDStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('exports');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [exportsRes, statsRes] = await Promise.all([
        fetch('/api/afd-export?limit=10'),
        fetch('/api/afd-export/stats')
      ]);

      if (exportsRes.ok) setExports((await exportsRes.json()).data);
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateExport = async () => {
    if (!startDate || !endDate) {
      alert('Selecione as datas de início e fim');
      return;
    }

    try {
      const response = await fetch('/api/afd-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: 'sample-company-id',
          startDate,
          endDate
        })
      });

      if (response.ok) {
        await loadData();
        setStartDate('');
        setEndDate('');
      }
    } catch (error) {
      console.error('Erro ao gerar exportação:', error);
    }
  };

  const downloadFile = async (exportId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/afd-export/download/${exportId}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao fazer download:', error);
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      PENDING: 'Pendente',
      PROCESSING: 'Processando',
      COMPLETED: 'Concluído',
      FAILED: 'Falhou',
      EXPIRED: 'Expirado'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <h2 className="text-2xl font-bold">Exportação AFD</h2>
          <p className="text-muted-foreground">
            Geração e download de arquivos AFD para fiscalização
          </p>
        </div>
        <div className="flex gap-2">
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
              <CardTitle className="text-sm font-medium">Total de Exportações</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExports}</div>
              <p className="text-xs text-muted-foreground">
                exportações realizadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedExports}</div>
              <p className="text-xs text-muted-foreground">
                de {stats.totalExports} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Falharam</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failedExports}</div>
              <p className="text-xs text-muted-foreground">
                exportações com erro
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                registros exportados
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="exports">Exportações</TabsTrigger>
          <TabsTrigger value="generate">Gerar Nova</TabsTrigger>
        </TabsList>

        <TabsContent value="exports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exportações Realizadas</CardTitle>
              <CardDescription>
                Histórico de exportações AFD geradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exports.map((exportItem) => (
                  <div key={exportItem.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">
                          {exportItem.fileName}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          v{exportItem.afdVersion}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(exportItem.status)}>
                          {getStatusLabel(exportItem.status)}
                        </Badge>
                        {exportItem.status === 'COMPLETED' && (
                          <Button
                            onClick={() => downloadFile(exportItem.id, exportItem.fileName)}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Empresa:</span>
                        <p className="font-medium">{exportItem.metadata.company.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Período:</span>
                        <p className="font-medium">
                          {new Date(exportItem.startDate).toLocaleDateString('pt-BR')} - {new Date(exportItem.endDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Registros:</span>
                        <p className="font-medium">{exportItem.recordCount.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tamanho:</span>
                        <p className="font-medium">{formatFileSize(exportItem.fileSize)}</p>
                      </div>
                    </div>
                    {exportItem.metadata.employee && (
                      <div className="text-sm text-muted-foreground mt-2">
                        Funcionário: {exportItem.metadata.employee.name} ({exportItem.metadata.employee.registration})
                      </div>
                    )}
                    {exportItem.metadata.compliance.violations.length > 0 && (
                      <div className="text-sm text-red-600 mt-2">
                        <strong>Violações:</strong> {exportItem.metadata.compliance.violations.join(', ')}
                      </div>
                    )}
                    {exportItem.metadata.compliance.warnings.length > 0 && (
                      <div className="text-sm text-yellow-600 mt-2">
                        <strong>Avisos:</strong> {exportItem.metadata.compliance.warnings.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerar Nova Exportação AFD</CardTitle>
              <CardDescription>
                Selecione o período para gerar um arquivo AFD
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Data de Fim</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={generateExport} className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Exportação AFD
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 