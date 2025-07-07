import { Metadata } from 'next';
import { SecureStorageManager } from '@/components/secure-storage/secure-storage-manager';

export const metadata: Metadata = {
  title: 'Armazenamento Seguro - Sistema de Ponto',
  description: 'Módulo 8.16 - Armazenamento seguro com redundância, verificação de integridade e backup automático',
};

export default function SecureStoragePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Módulo 8.16</h1>
        <h2 className="text-2xl font-semibold text-muted-foreground">
          Armazenamento Seguro com Redundância
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Sistema completo de armazenamento seguro com redundância automática, 
          verificação de integridade, backup programado e monitoramento de saúde 
          dos sistemas de storage.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SecureStorageManager />
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Funcionalidades</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Redundância automática de dados</li>
              <li>• Verificação de integridade</li>
              <li>• Backup programado</li>
              <li>• Monitoramento de saúde</li>
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
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 