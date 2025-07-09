import { AuditDashboard } from '@/components/audit/audit-dashboard';
import { metadata } from './metadata';

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