import { ExecutiveDashboardComponent } from '@/components/executive/executive-dashboard';

export default function RelatoriosExecutivosPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <ExecutiveDashboardComponent companyId="demo-company" />
    </div>
  );
} 