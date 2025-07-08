'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Download, RotateCcw } from 'lucide-react';

interface RestoreOperation {
  id: string;
  timestamp: Date;
  status: string;
  backupId: string;
  entityTypes: string[];
  fileName?: string;
  fileHash?: string;
  restoredCount: number;
  error?: string;
  duration?: number;
}

export function DisasterRecoveryManager() {
  const [restores, setRestores] = useState<RestoreOperation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestores();
  }, []);

  const loadRestores = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/secure-storage/restore?limit=10');
      if (res.ok) setRestores((await res.json()).data);
    } catch (error) {
      console.error('Erro ao carregar restores:', error);
    } finally {
      setLoading(false);
    }
  };

  const startRestore = async () => {
    // Exemplo: inicia restauração do backup mais recente
    try {
      const backupRes = await fetch('/api/secure-storage/backup?status=SUCCESS&limit=1');
      const backups = backupRes.ok ? (await backupRes.json()).data : [];
      if (!backups.length) return alert('Nenhum backup disponível');
      const backup = backups[0];
      const response = await fetch('/api/secure-storage/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupId: backup.id,
          entityTypes: backup.entityTypes
        })
      });
      if (response.ok) await loadRestores();
    } catch (error) {
      console.error('Erro ao iniciar restauração:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'PARTIAL':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Disaster Recovery</CardTitle>
          <CardDescription>Recuperação e restauração de dados a partir de backups</CardDescription>
        </div>
        <Button onClick={startRestore} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Iniciar Restauração
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {restores.map((restore) => (
            <div key={restore.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span className="font-medium">Backup #{restore.backupId}</span>
                  <span className="text-sm text-muted-foreground">
                    {restore.entityTypes.join(', ')}
                  </span>
                </div>
                <Badge className={getStatusColor(restore.status)}>
                  {restore.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Restaurados:</span>
                  <p className="font-medium">{restore.restoredCount}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Arquivo:</span>
                  <p className="font-medium">{restore.fileName || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Hash:</span>
                  <p className="font-medium">{restore.fileHash || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Data:</span>
                  <p className="font-medium">
                    {new Date(restore.timestamp).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              {restore.duration && (
                <div className="text-sm text-muted-foreground mt-2">
                  Duração: {restore.duration}ms
                </div>
              )}
              {restore.error && (
                <div className="text-sm text-red-600 mt-2">
                  Erro: {restore.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 