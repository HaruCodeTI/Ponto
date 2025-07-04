"use client";
import { CompanyForm } from "@/components/company/company-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Company } from "@/types/company";

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

export default function EmpresaConfiguracoesPage() {
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

  return (
    <main className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Configurações da Empresa</h1>
      <Card>
        <CardHeader>
          <CardTitle>Editar Dados da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyForm initialValues={company} onSubmit={handleEdit} />
        </CardContent>
      </Card>
    </main>
  );
} 