import { Metadata } from 'next';
import { AuditDashboard } from '@/components/audit/audit-dashboard';

export const metadata: Metadata = {
  title: 'Sistema de Auditoria Avançada | Ponto',
  description: 'Monitoramento avançado de segurança, compliance e logs de auditoria do sistema de ponto eletrônico',
};

export default function AuditoriaPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Dashboard</span>
        <span>/</span>
        <span>Auditoria Avançada</span>
      </div>

      <AuditDashboard />
    </div>
  );
} 