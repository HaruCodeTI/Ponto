"use client";
import { useState, useEffect } from "react";
import { CompanyForm } from "@/components/company/company-form";
import { SubscriptionManager } from "@/components/plans/subscription-manager";
import { PlanLimitsDisplay } from "@/components/plans/plan-limits-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Company, Subscription, PlanConfig } from "@/types/company";
import { PlanUsage } from "@/lib/plan-limits";
import { getPlanConfig } from "@/content/plans";
import { toast } from "sonner";

// Mock temporário para exibição/edição
const company: Company = {
  id: "1",
  name: "Acme Ltda",
  cnpj: "12.345.678/0001-99",
  address: "Rua Exemplo, 123, Centro, São Paulo, SP",
  latitude: -23.5505,
  longitude: -46.6333,
  operationType: "PRESENCIAL",
  employeeCount: 42,
  plan: "PROFESSIONAL",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock da assinatura
const mockSubscription: Subscription = {
  id: "sub_1",
  companyId: "1",
  plan: "PROFESSIONAL",
  status: "ACTIVE",
  currentPeriodStart: new Date().toISOString(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
  employeeCount: 42,
  monthlyAmount: 99.90,
  cancelAtPeriodEnd: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock do uso
const mockUsage: PlanUsage = {
  employees: 42,
  locations: 1,
  timeRecords: 1250,
  reports: 15,
  integrations: []
};

export default function EmpresaConfiguracoesPage() {
  const [subscription, setSubscription] = useState<Subscription | undefined>(mockSubscription);
  const [usage, setUsage] = useState<PlanUsage>(mockUsage);
  const [currentPlan] = useState<PlanConfig | undefined>(getPlanConfig(company.plan));

  useEffect(() => {
    // Carregar dados reais da assinatura
    fetchSubscription();
    // Carregar dados reais de uso
    fetchUsage();
  }, []);

  async function fetchSubscription() {
    try {
      const res = await fetch("/api/subscription");
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error("Erro ao carregar assinatura:", error);
    }
  }

  async function fetchUsage() {
    try {
      const res = await fetch("/api/subscription/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data.usage);
      }
    } catch (error) {
      console.error("Erro ao carregar uso:", error);
    }
  }

  async function handleEdit(data: Company) {
    try {
      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao atualizar empresa");
      toast.success("Empresa atualizada com sucesso!");
    } catch {
      toast.error("Erro ao atualizar empresa");
    }
  }

  async function handleUpgradePlan(plan: PlanConfig) {
    // Implementar lógica de upgrade
    toast.info(`Funcionalidade de upgrade para ${plan.id} em desenvolvimento`);
  }

  // async function handleCancelSubscription() {
  //   try {
  //     const res = await fetch("/api/subscription", {
  //       method: "DELETE",
  //     });
  //     if (!res.ok) throw new Error("Erro ao cancelar assinatura");
  //     
  //     toast.success("Assinatura cancelada com sucesso!");
  //     await fetchSubscription(); // Recarregar dados
  //   } catch {
  //     toast.error("Erro ao cancelar assinatura");
  //   }
  // }

  // async function handleUpdateBilling() {
  //   // Implementar lógica de atualização de cobrança
  //   toast.info("Funcionalidade de atualização de cobrança em desenvolvimento");
  // }

  if (!currentPlan) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Plano não encontrado</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Configurações da Empresa</h1>
      
      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="empresa">Dados da Empresa</TabsTrigger>
          <TabsTrigger value="assinatura">Assinatura e Planos</TabsTrigger>
          <TabsTrigger value="limites">Limites do Plano</TabsTrigger>
        </TabsList>
        
        <TabsContent value="empresa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Editar Dados da Empresa</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyForm initialValues={company} onSubmit={handleEdit} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assinatura" className="space-y-6">
          <SubscriptionManager
            currentSubscription={subscription}
          />
        </TabsContent>

        <TabsContent value="limites" className="space-y-6">
          <PlanLimitsDisplay
            plan={currentPlan}
            usage={usage}
            onUpgrade={handleUpgradePlan}
            showRecommendations={true}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
} 