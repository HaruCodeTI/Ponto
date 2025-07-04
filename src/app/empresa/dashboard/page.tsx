import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCoordinates } from "@/lib/geolocation";
import { Company } from "@/types/company";
import { Button } from "@/components/ui/button";

// Mock temporário para exibição
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

function EstatisticasEmpresa({ company }: { company: Company }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estatísticas</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold">{company.employeeCount}</div>
          <div className="text-xs text-muted-foreground">Funcionários</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{company.plan}</div>
          <div className="text-xs text-muted-foreground">Plano</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{company.operationType}</div>
          <div className="text-xs text-muted-foreground">Tipo de Operação</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{new Date(company.createdAt).toLocaleDateString()}</div>
          <div className="text-xs text-muted-foreground">Criada em</div>
        </div>
      </CardContent>
    </Card>
  );
}

function GestaoPlanoEmpresa({ company }: { company: Company }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Plano</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="font-semibold">Plano atual:</span> {company.plan}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={company.plan === "BASIC" ? "default" : "outline"} disabled={company.plan === "BASIC"}>Básico</Button>
          <Button variant={company.plan === "PROFESSIONAL" ? "default" : "outline"} disabled={company.plan === "PROFESSIONAL"}>Profissional</Button>
          <Button variant={company.plan === "PREMIUM" ? "default" : "outline"} disabled={company.plan === "PREMIUM"}>Premium</Button>
        </div>
        <div className="text-xs text-muted-foreground">Em breve: upgrade/downgrade de plano e integração com pagamento.</div>
      </CardContent>
    </Card>
  );
}

export default function EmpresaDashboardPage() {
  return (
    <main className="container mx-auto py-8 grid gap-8 max-w-3xl">
      <h1 className="text-3xl font-bold">Dashboard da Empresa</h1>
      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-semibold">{company.name}</span>
            <Badge variant="secondary">{company.plan}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">CNPJ: {company.cnpj}</div>
          <div className="text-sm text-muted-foreground">Endereço: {company.address}</div>
          <div className="text-sm text-muted-foreground">Funcionários: {company.employeeCount}</div>
          <div className="text-sm text-muted-foreground">Tipo de Operação: {company.operationType}</div>
          <div className="text-sm text-muted-foreground">
            Localização: {company.latitude && company.longitude ? formatCoordinates(company.latitude, company.longitude) : "Não definida"}
          </div>
        </CardContent>
      </Card>
      <EstatisticasEmpresa company={company} />
      <GestaoPlanoEmpresa company={company} />
      {/* Futuro: Card com mapa, métricas, ações rápidas, etc */}
    </main>
  );
} 