"use client";

import { Employee } from "@/types/employee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeForm } from "@/components/employee/employee-form";

import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock temporário para exibição
const employee: Employee = {
  id: "1",
  cpf: "123.456.789-00",
  position: "Analista",
  salary: 3500,
  workSchedule: "PRESENCIAL",
  toleranceMinutes: 10,
  bankHours: 2,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: "u1",
  companyId: "c1",
  weeklySchedule: {
    "Segunda-feira": "08:00-17:00",
    "Terça-feira": "08:00-17:00",
    "Quarta-feira": "08:00-17:00",
    "Quinta-feira": "08:00-17:00",
    "Sexta-feira": "08:00-17:00",
  },
  workRule: "CLT",
};

// Mock de histórico de ponto
type TimeRecord = {
  id: string;
  type: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  deviceInfo?: string;
};

const timeRecords: TimeRecord[] = [
  {
    id: "1",
    type: "ENTRADA",
    timestamp: new Date().toISOString(),
    latitude: -23.5505,
    longitude: -46.6333,
    deviceInfo: "iPhone 13",
  },
  {
    id: "2",
    type: "SAÍDA",
    timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
    latitude: -23.5505,
    longitude: -46.6333,
    deviceInfo: "iPhone 13",
  },
];

// Mock de histórico de banco de horas
type BankHoursRecord = {
  id: string;
  date: string;
  change: number;
  reason: string;
};

const bankHoursHistory: BankHoursRecord[] = [
  { id: "1", date: new Date().toISOString(), change: 1.5, reason: "Hora extra" },
  { id: "2", date: new Date(Date.now() - 86400000).toISOString(), change: -0.5, reason: "Saída antecipada" },
];

export default function PerfilFuncionarioPage() {


  async function handleEdit(data: Employee) {
    try {
      const res = await fetch("/api/employee", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao atualizar funcionário");
      toast.success("Funcionário atualizado com sucesso!");
    } catch {
      toast.error("Erro ao atualizar funcionário");
    }
  }

  return (
    <main className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Perfil do Funcionário</h1>
      <Card>
        <CardHeader>
          <CardTitle>{employee.position}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <div className="font-semibold">CPF: {employee.cpf}</div>
          <div>Regra: {employee.workRule}</div>
          <div>Jornada: {employee.workSchedule}</div>
          <div>Salário: R$ {employee.salary.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
          <div>Tolerância: {employee.toleranceMinutes} min</div>
          <div>Banco de Horas: {employee.bankHours} h</div>
          <div className="text-xs text-muted-foreground">Criado em: {new Date(employee.createdAt).toLocaleDateString()}</div>
        </CardContent>
      </Card>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Editar Dados do Funcionário</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeForm initialValues={employee} onSubmit={handleEdit} />
        </CardContent>
      </Card>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Histórico de Ponto</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Dispositivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeRecords.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell>{new Date(rec.timestamp).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>{rec.type}</TableCell>
                  <TableCell>
                    {rec.latitude && rec.longitude
                      ? `${rec.latitude.toFixed(5)}, ${rec.longitude.toFixed(5)}`
                      : "-"}
                  </TableCell>
                  <TableCell>{rec.deviceInfo || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Banco de Horas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <span className="font-semibold">Saldo atual:</span> {employee.bankHours} h
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Alteração</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bankHoursHistory.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell>{new Date(rec.date).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>{rec.change > 0 ? "+" : ""}{rec.change} h</TableCell>
                  <TableCell>{rec.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
} 