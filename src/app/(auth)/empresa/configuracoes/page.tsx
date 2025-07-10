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
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";

const defaultPlanUsage: PlanUsage = {
  employees: 0,
  locations: 0,
  timeRecords: 0,
  reports: 0,
  integrations: [],
};

export default function EmpresaConfiguracoesPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | undefined>(undefined);
  const [usage, setUsage] = useState<PlanUsage | undefined>(undefined);
  const [currentPlan, setCurrentPlan] = useState<PlanConfig | undefined>(undefined);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  async function handleCreate(data: Company) {
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erro ao cadastrar empresa');
      toast.success('Empresa cadastrada com sucesso!');
      fetchCompany();
    } catch {
      toast.error('Erro ao cadastrar empresa');
    }
  }

  useEffect(() => {
    fetchCompany();
    fetchSubscription();
    fetchUsage();
  }, []);

  async function fetchCompany() {
    setLoading(true);
    try {
      const res = await fetch('/api/company');
      if (res.ok) {
        const data = await res.json();
        setCompany(data.company);
        setCurrentPlan(getPlanConfig(data.company.plan));
      } else {
        setCompany(null);
      }
    } catch (error) {
      setCompany(null);
      // nada a fazer
    } finally {
      setLoading(false);
    }
  }

  async function fetchSubscription() {
    try {
      const res = await fetch('/api/subscription');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
      }
    } catch {
      // nada a fazer
    }
  }

  async function fetchUsage() {
    try {
      const res = await fetch('/api/subscription/usage');
      if (res.ok) {
        const data = await res.json();
        setUsage(data.usage);
      }
    } catch {
      // nada a fazer
    }
  }

  async function handleEdit(data: Company) {
    try {
      const res = await fetch('/api/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erro ao atualizar empresa');
      toast.success('Empresa atualizada com sucesso!');
      fetchCompany();
    } catch {
      toast.error('Erro ao atualizar empresa');
    }
  }

  async function handleUpgradePlan(plan: PlanConfig) {
    toast.info(`Funcionalidade de upgrade para ${plan.id} em desenvolvimento`);
  }

  const handleDelete = async () => {
    if (!company) return;
    if (!window.confirm('Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.')) return;
    const res = await fetch(`/api/company/${company.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Empresa excluída com sucesso!');
      window.location.href = '/auth/signin';
    } else {
      toast.error('Erro ao excluir empresa');
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8">Carregando...</div>;
  }

  if (!company) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Cadastrar Empresa</h1>
        <CompanyForm initialValues={undefined} onSubmit={handleCreate} />
      </div>
    );
  }

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="empresa">Dados da Empresa</TabsTrigger>
          <TabsTrigger value="assinatura">Assinatura e Planos</TabsTrigger>
          <TabsTrigger value="limites">Limites do Plano</TabsTrigger>
        </TabsList>
        <TabsContent value="empresa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyForm initialValues={company} onSubmit={handleEdit} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="assinatura" className="space-y-6">
          <SubscriptionManager currentSubscription={subscription} />
        </TabsContent>
        <TabsContent value="limites" className="space-y-6">
          <PlanLimitsDisplay plan={currentPlan} usage={usage ?? defaultPlanUsage} onUpgrade={handleUpgradePlan} showRecommendations={true} />
        </TabsContent>
      </Tabs>
      {isAdmin && (
        <Button variant="destructive" className="mt-6" onClick={handleDelete}>
          Excluir Empresa
        </Button>
      )}
    </main>
  );
} 