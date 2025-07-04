"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, Users, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { exportHoursReportToPDF } from "@/lib/pdf-export";

interface HoursReportProps {
  companyId?: string;
}

interface EmployeeData {
  id: string;
  name: string;
  position: string;
  workSchedule: string;
  salary: number;
  periodCalculation: {
    workDays: number;
    completeDays: number;
    lateDays: number;
    earlyDepartureDays: number;
    overtimeDays: number;
    nightShiftDays: number;
    totalRegularMinutes: number;
    totalOvertimeMinutes: number;
    totalBreakMinutes: number;
    totalNightShiftMinutes: number;
    totalDelayMinutes: number;
    totalEarlyDepartureMinutes: number;
    totalRegularFormatted: string;
    totalOvertimeFormatted: string;
    totalBreakFormatted: string;
    totalNightShiftFormatted: string;
    totalDelayFormatted: string;
    totalEarlyDepartureFormatted: string;
  };
  bankHours: {
    initialBalance: number;
    credits: number;
    debits: number;
    finalBalance: number;
    initialBalanceFormatted: string;
    creditsFormatted: string;
    debitsFormatted: string;
    finalBalanceFormatted: string;
  };
}

interface HoursReportData {
  period: { startDate: string; endDate: string };
  companyId: string;
  employees: EmployeeData[];
  totals: {
    totalEmployees: number;
    totalWorkDays: number;
    totalRegularFormatted: string;
    totalOvertimeFormatted: string;
    totalBreakFormatted: string;
    totalNightShiftFormatted: string;
    totalDelayFormatted: string;
    totalEarlyDepartureFormatted: string;
    totalSalaryFormatted: string;
    averageHoursPerEmployee: string;
    averageOvertimePerEmployee: string;
    totalBankHoursCreditsFormatted: string;
    totalBankHoursDebitsFormatted: string;
    netBankHoursFormatted: string;
  };
  summary: {
    period: string;
    totalEmployees: number;
    totalWorkDays: number;
    totalRegularHours: string;
    totalOvertimeHours: string;
    totalBankHoursCredits: string;
    totalBankHoursDebits: string;
    netBankHours: string;
    totalSalary: string;
  };
}

export function HoursReport({ companyId }: HoursReportProps) {
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [employeeId, setEmployeeId] = useState<string>("");
  const [position, setPosition] = useState<string>("");
  const [workSchedule, setWorkSchedule] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<HoursReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    if (!companyId || !startDate || !endDate) {
      setError("Selecione o período");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reports/hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          startDate,
          endDate,
          employeeId: employeeId || undefined,
          position: position || undefined,
          workSchedule: workSchedule || undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Erro ao gerar relatório");
        return;
      }

      setData(result.data);
    } catch {
      setError("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!data) return;
    const wsData = [
      [
        "Funcionário",
        "Setor",
        "Jornada",
        "Dias Trabalhados",
        "Horas Regulares",
        "Horas Extras",
        "Atrasos",
        "Saídas Antecipadas",
        "Saldo Inicial Banco",
        "Créditos Banco",
        "Débitos Banco",
        "Saldo Final Banco"
      ],
      ...data.employees.map((employee) => [
        employee.name,
        employee.position,
        employee.workSchedule,
        employee.periodCalculation.workDays,
        employee.periodCalculation.totalRegularFormatted,
        employee.periodCalculation.totalOvertimeFormatted,
        employee.periodCalculation.totalDelayFormatted,
        employee.periodCalculation.totalEarlyDepartureFormatted,
        employee.bankHours.initialBalanceFormatted,
        employee.bankHours.creditsFormatted,
        employee.bankHours.debitsFormatted,
        employee.bankHours.finalBalanceFormatted
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório de Horas");
    XLSX.writeFile(wb, `relatorio-horas-${startDate}-${endDate}.xlsx`);
  };

  const handleExportCSV = () => {
    if (!data) return;
    const csvData = [
      [
        "Funcionário",
        "Setor",
        "Jornada",
        "Dias Trabalhados",
        "Horas Regulares",
        "Horas Extras",
        "Atrasos",
        "Saídas Antecipadas",
        "Saldo Inicial Banco",
        "Créditos Banco",
        "Débitos Banco",
        "Saldo Final Banco"
      ],
      ...data.employees.map((employee) => [
        employee.name,
        employee.position,
        employee.workSchedule,
        employee.periodCalculation.workDays,
        employee.periodCalculation.totalRegularFormatted,
        employee.periodCalculation.totalOvertimeFormatted,
        employee.periodCalculation.totalDelayFormatted,
        employee.periodCalculation.totalEarlyDepartureFormatted,
        employee.bankHours.initialBalanceFormatted,
        employee.bankHours.creditsFormatted,
        employee.bankHours.debitsFormatted,
        employee.bankHours.finalBalanceFormatted
      ])
    ];
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio-horas-${startDate}-${endDate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!data) return;
    exportHoursReportToPDF(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Relatório de Horas Trabalhadas, Extras e Banco de Horas
          </CardTitle>
          <CardDescription>
            Relatório consolidado de horas trabalhadas, horas extras e banco de horas por período
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleGenerateReport} disabled={isLoading} className="w-full">
                {isLoading ? "Gerando..." : "Gerar Relatório"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Funcionário (Opcional)</Label>
              <Input
                id="employeeId"
                type="text"
                placeholder="ID do funcionário"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Setor/Cargo (Opcional)</Label>
              <Input
                id="position"
                type="text"
                placeholder="Ex: Técnico, Administrativo..."
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workSchedule">Jornada (Opcional)</Label>
              <select
                id="workSchedule"
                className="w-full border rounded px-3 py-2"
                value={workSchedule}
                onChange={(e) => setWorkSchedule(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="PRESENCIAL">Presencial</option>
                <option value="HOME_OFFICE">Home Office</option>
                <option value="HYBRID">Híbrida</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data && (
        <div className="space-y-6">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              Exportar Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              Exportar PDF
            </Button>
          </div>

          {/* Resumo Executivo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Resumo Executivo - {data.summary.period}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.totals.totalEmployees}
                  </div>
                  <div className="text-sm text-muted-foreground">Funcionários</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {data.totals.totalRegularFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">Horas Regulares</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {data.totals.totalOvertimeFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">Horas Extras</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {data.totals.netBankHoursFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">Saldo Banco de Horas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Banco de Horas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Banco de Horas - Resumo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {data.totals.totalBankHoursCreditsFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Créditos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {data.totals.totalBankHoursDebitsFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Débitos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.totals.averageHoursPerEmployee}
                  </div>
                  <div className="text-sm text-muted-foreground">Média por Funcionário</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {data.totals.averageOvertimePerEmployee}
                  </div>
                  <div className="text-sm text-muted-foreground">Média Extras por Funcionário</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhamento por Funcionário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Detalhamento por Funcionário ({data.employees.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Jornada</TableHead>
                      <TableHead className="text-right">Dias</TableHead>
                      <TableHead className="text-right">Horas Regulares</TableHead>
                      <TableHead className="text-right">Horas Extras</TableHead>
                      <TableHead className="text-right">Atrasos</TableHead>
                      <TableHead className="text-right">Saídas Antecipadas</TableHead>
                      <TableHead className="text-right">Saldo Inicial</TableHead>
                      <TableHead className="text-right">Créditos</TableHead>
                      <TableHead className="text-right">Débitos</TableHead>
                      <TableHead className="text-right">Saldo Final</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          {employee.name}
                        </TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>{employee.workSchedule}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">
                            {employee.periodCalculation.workDays}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">
                            {employee.periodCalculation.totalRegularFormatted}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-orange-600">
                            {employee.periodCalculation.totalOvertimeFormatted}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive">
                            {employee.periodCalculation.totalDelayFormatted}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive">
                            {employee.periodCalculation.totalEarlyDepartureFormatted}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">
                            {employee.bankHours.initialBalanceFormatted}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-green-600">
                            {employee.bankHours.creditsFormatted}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-red-600">
                            {employee.bankHours.debitsFormatted}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={employee.bankHours.finalBalance >= 0 ? "default" : "destructive"}
                          >
                            {employee.bankHours.finalBalanceFormatted}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Alertas */}
          {data.employees.some(emp => emp.bankHours.finalBalance < 0) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Atenção: Alguns funcionários possuem saldo negativo no banco de horas.
              </AlertDescription>
            </Alert>
          )}

          {data.employees.some(emp => emp.periodCalculation.totalOvertimeMinutes > 600) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Atenção: Alguns funcionários excederam o limite de horas extras (10h/semana).
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
} 