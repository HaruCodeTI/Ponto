import { PlanComparison } from '@/components/plans/plan-comparison';
import { EmployeeBillingCalculator } from '@/components/plans/employee-billing-calculator';
import { SubscriptionManager } from '@/components/plans/subscription-manager';
import { SubscriptionHistory } from '@/components/plans/subscription-history';
import { SubscriptionActions } from '@/components/plans/subscription-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PlanosPage() {
  return (
    <main className="container mx-auto py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Planos e Preços</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Escolha o plano ideal para sua empresa. Todos os planos incluem funcionalidades essenciais 
          de controle de ponto com compliance à Portaria 671/2021.
        </p>
      </div>

      <Tabs defaultValue="comparacao" className="space-y-8">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="comparacao">Comparação de Planos</TabsTrigger>
          <TabsTrigger value="calculadora">Calculadora de Preços</TabsTrigger>
          <TabsTrigger value="assinatura">Minha Assinatura</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="acoes">Ações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="comparacao" className="space-y-6">
          <PlanComparison />
        </TabsContent>

        <TabsContent value="calculadora" className="space-y-6">
          <EmployeeBillingCalculator 
            currentEmployeeCount={25}
            currentPlan="PROFESSIONAL"
            showRecommendations={true}
          />
        </TabsContent>

        <TabsContent value="assinatura" className="space-y-6">
          <SubscriptionManager />
        </TabsContent>

        <TabsContent value="historico" className="space-y-6">
          <SubscriptionHistory />
        </TabsContent>

        <TabsContent value="acoes" className="space-y-6">
          <SubscriptionActions 
            currentSubscription={{
              id: '1',
              plan: 'PROFESSIONAL',
              status: 'ACTIVE',
              employeeCount: 25,
              monthlyAmount: 1247.50,
              currentPeriodEnd: '2024-02-29',
              cancelAtPeriodEnd: false
            }}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
} 