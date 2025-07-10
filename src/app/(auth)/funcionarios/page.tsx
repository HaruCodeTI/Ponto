import { Employee } from "@/types/employee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock temporário para exibição
const employees: Employee[] = [
  {
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
  },
  {
    id: "2",
    cpf: "987.654.321-00",
    position: "Desenvolvedor",
    salary: 5000,
    workSchedule: "HOME_OFFICE",
    toleranceMinutes: 5,
    bankHours: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: "u2",
    companyId: "c1",
    weeklySchedule: {
      "Segunda-feira": "09:00-18:00",
      "Terça-feira": "09:00-18:00",
      "Quarta-feira": "09:00-18:00",
      "Quinta-feira": "09:00-18:00",
      "Sexta-feira": "09:00-18:00",
    },
    workRule: "PJ",
  },
];

export default function FuncionariosPage() {
  return (
    <main className="container mx-auto py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Funcionários</h1>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Funcionários</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CPF</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Jornada</TableHead>
                <TableHead>Regra</TableHead>
                <TableHead>Salário</TableHead>
                <TableHead>Tolerância</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>{emp.cpf}</TableCell>
                  <TableCell>{emp.position}</TableCell>
                  <TableCell>{emp.workSchedule}</TableCell>
                  <TableCell>{emp.workRule}</TableCell>
                  <TableCell>R$ {emp.salary.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>{emp.toleranceMinutes} min</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
} 