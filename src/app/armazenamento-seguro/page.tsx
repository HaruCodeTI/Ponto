import { Metadata } from 'next';
import { SecureStorageManager } from '@/components/secure-storage/secure-storage-manager';
import { DisasterRecoveryManager } from '@/components/secure-storage/disaster-recovery-manager';
import { DataRetentionManager } from '@/components/secure-storage/data-retention-manager';

export const metadata: Metadata = {
  title: 'Armazenamento Seguro - Sistema de Ponto',
  description: 'Módulos 8.16, 8.17 e 8.18 - Armazenamento seguro com redundância, disaster recovery e retenção de dados',
};

export default function SecureStoragePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Módulos 8.16, 8.17 e 8.18</h1>
        <h2 className="text-2xl font-semibold text-muted-foreground">
          Armazenamento Seguro, Disaster Recovery e Retenção de Dados
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Sistema completo de armazenamento seguro com redundância automática, 
          verificação de integridade, backup programado, disaster recovery e 
          políticas de retenção e expurgo seguro de dados.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SecureStorageManager />
          <DisasterRecoveryManager />
          <DataRetentionManager />
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Funcionalidades</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Redundância automática de dados</li>
              <li>• Verificação de integridade</li>
              <li>• Backup programado</li>
              <li>• Monitoramento de saúde</li>
              <li>• Disaster recovery</li>
              <li>• Políticas de retenção</li>
              <li>• Expurgo seguro de dados</li>
              <li>• Compliance com Portaria 671/2021</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Benefícios</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Proteção contra perda de dados</li>
              <li>• Detecção de corrupção</li>
              <li>• Recuperação automática</li>
              <li>• Auditoria completa</li>
              <li>• Conformidade legal</li>
              <li>• Gestão de ciclo de vida</li>
            </ul>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-900 mb-2">Compliance</h3>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• Retenção de 5 anos</li>
              <li>• Integridade garantida</li>
              <li>• Disponibilidade 24/7</li>
              <li>• Rastreabilidade completa</li>
              <li>• Backup em múltiplas localizações</li>
              <li>• Expurgo seguro e auditado</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 