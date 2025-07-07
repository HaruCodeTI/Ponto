'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Download, CheckCircle, QrCode, Printer, FileText } from 'lucide-react';

interface TimeRecordReceipt {
  id: string;
  timestamp: Date;
  timeRecordId: string;
  employeeId: string;
  companyId: string;
  receiptType: string;
  receiptData: {
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
      address?: string;
    };
    timeRecord: {
      id: string;
      timestamp: Date;
      type: string;
      location?: {
        latitude: number;
        longitude: number;
        address?: string;
      };
      device?: {
        id: string;
        type: string;
        identifier: string;
      };
    };
    receipt: {
      id: string;
      generatedAt: Date;
      expiresAt: Date;
      verificationUrl?: string;
    };
  };
  hash: string;
  qrCode?: string;
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
}

interface ReceiptStats {
  totalReceipts: number;
  verifiedReceipts: number;
  expiredReceipts: number;
  receiptsByType: Record<string, number>;
  lastReceipt: Date | null;
}

export function TimeReceiptViewer() {
  const [receipts, setReceipts] = useState<TimeRecordReceipt[]>([]);
  const [stats, setStats] = useState<ReceiptStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('receipts');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [receiptsRes, statsRes] = await Promise.all([
        fetch('/api/time-receipt?limit=10'),
        fetch('/api/time-receipt/stats')
      ]);

      if (receiptsRes.ok) setReceipts((await receiptsRes.json()).data);
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReceipt = async () => {
    try {
      const response = await fetch('/api/time-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeRecordId: 'sample-record-id',
          employeeId: 'sample-employee-id',
          companyId: 'sample-company-id',
          receiptType: 'CLOCK_IN'
        })
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao gerar comprovante:', error);
    }
  };

  const verifyReceipt = async (receiptId: string) => {
    try {
      const response = await fetch('/api/time-receipt/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptId })
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao verificar comprovante:', error);
    }
  };

  const printReceipt = (receipt: TimeRecordReceipt) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Comprovante de Ponto</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
              .section { margin: 15px 0; }
              .label { font-weight: bold; }
              .value { margin-left: 10px; }
              .qr-code { text-align: center; margin: 20px 0; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>COMPROVANTE DE PONTO</h1>
              <h2>${receipt.receiptData.company.name}</h2>
            </div>
            
            <div class="section">
              <div class="label">Funcionário:</div>
              <div class="value">${receipt.receiptData.employee.name} (${receipt.receiptData.employee.registration})</div>
            </div>
            
            <div class="section">
              <div class="label">Tipo de Registro:</div>
              <div class="value">${receipt.receiptType}</div>
            </div>
            
            <div class="section">
              <div class="label">Data/Hora:</div>
              <div class="value">${new Date(receipt.receiptData.timeRecord.timestamp).toLocaleString('pt-BR')}</div>
            </div>
            
            <div class="section">
              <div class="label">ID do Registro:</div>
              <div class="value">${receipt.timeRecordId}</div>
            </div>
            
            <div class="section">
              <div class="label">Hash de Verificação:</div>
              <div class="value">${receipt.hash}</div>
            </div>
            
            <div class="qr-code">
              <div class="label">Código QR para Verificação</div>
              <div style="font-family: monospace; font-size: 10px; margin-top: 10px;">
                ${receipt.qrCode || 'QR Code não disponível'}
              </div>
            </div>
            
            <div class="footer">
              <p>Comprovante gerado em: ${new Date(receipt.receiptData.receipt.generatedAt).toLocaleString('pt-BR')}</p>
              <p>Válido até: ${new Date(receipt.receiptData.receipt.expiresAt).toLocaleString('pt-BR')}</p>
              <p>Para verificar: ${receipt.receiptData.receipt.verificationUrl}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getReceiptTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CLOCK_IN: 'Entrada',
      CLOCK_OUT: 'Saída',
      BREAK_START: 'Início do Intervalo',
      BREAK_END: 'Fim do Intervalo',
      ADJUSTMENT: 'Ajuste',
      VERIFICATION: 'Verificação'
    };
    return labels[type] || type;
  };

  const getStatusColor = (isVerified: boolean) => {
    return isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
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
          <h2 className="text-2xl font-bold">Comprovante de Ponto Imediato</h2>
          <p className="text-muted-foreground">
            Geração, visualização e verificação de comprovantes de ponto
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateReceipt} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Gerar Comprovante
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
              <CardTitle className="text-sm font-medium">Total de Comprovantes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReceipts}</div>
              <p className="text-xs text-muted-foreground">
                comprovantes gerados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verificados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.verifiedReceipts}</div>
              <p className="text-xs text-muted-foreground">
                de {stats.totalReceipts} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expirados</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.expiredReceipts}</div>
              <p className="text-xs text-muted-foreground">
                comprovantes vencidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Último Comprovante</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.lastReceipt ? new Date(stats.lastReceipt).toLocaleDateString('pt-BR') : 'N/A'}
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
          <TabsTrigger value="receipts">Comprovantes</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="receipts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comprovantes Gerados</CardTitle>
              <CardDescription>
                Histórico de comprovantes de ponto gerados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {receipts.map((receipt) => (
                  <div key={receipt.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">
                          {receipt.receiptData.employee.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {getReceiptTypeLabel(receipt.receiptType)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(receipt.isVerified)}>
                          {receipt.isVerified ? 'Verificado' : 'Pendente'}
                        </Badge>
                        {!receipt.isVerified && (
                          <Button
                            onClick={() => verifyReceipt(receipt.id)}
                            variant="outline"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Verificar
                          </Button>
                        )}
                        <Button
                          onClick={() => printReceipt(receipt)}
                          variant="outline"
                          size="sm"
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Imprimir
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Matrícula:</span>
                        <p className="font-medium">{receipt.receiptData.employee.registration}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Data/Hora:</span>
                        <p className="font-medium">
                          {new Date(receipt.receiptData.timeRecord.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Empresa:</span>
                        <p className="font-medium">{receipt.receiptData.company.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Válido até:</span>
                        <p className="font-medium">
                          {new Date(receipt.receiptData.receipt.expiresAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    {receipt.receiptData.timeRecord.location && (
                      <div className="text-sm text-muted-foreground mt-2">
                        Localização: {receipt.receiptData.timeRecord.location.address || 
                          `${receipt.receiptData.timeRecord.location.latitude}, ${receipt.receiptData.timeRecord.location.longitude}`}
                      </div>
                    )}
                    {receipt.receiptData.timeRecord.device && (
                      <div className="text-sm text-muted-foreground mt-2">
                        Dispositivo: {receipt.receiptData.timeRecord.device.type} - {receipt.receiptData.timeRecord.device.identifier}
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
              <CardTitle>Estatísticas por Tipo</CardTitle>
              <CardDescription>
                Distribuição de comprovantes por tipo de registro
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.receiptsByType && (
                <div className="space-y-4">
                  {Object.entries(stats.receiptsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="font-medium">{getReceiptTypeLabel(type)}</span>
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