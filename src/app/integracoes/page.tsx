import { IntegrationManager } from '@/components/integrations/integration-manager';

export default function IntegracoesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <IntegrationManager companyId="demo-company" />
    </div>
  );
} 