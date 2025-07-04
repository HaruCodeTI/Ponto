"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, Users, TrendingUp, AlertTriangle, Building } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { exportMonthlyReportToPDF } from "@/lib/pdf-export";

interface MonthlyReportProps {
  companyId?: string;
}

interface EmployeeData {
  id: string;
  name: string;
  salary: number;
  monthlyCalculation: {
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
  position: string;
  workSchedule: string;
}

interface MonthlyReportData {
  month: string;
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
    attendanceRate: string;
    punctualityRate: string;
  };
  summary: {
    period: string;
    totalEmployees: number;
    totalWorkDays: number;
    totalRegularHours: string;
    totalOvertimeHours: string;
    totalSalary: string;
    attendanceRate: string;
    punctualityRate: string;
  };
}

export function MonthlyReport({ companyId }: MonthlyReportProps) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<MonthlyReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<string>("");
  const [workSchedule, setWorkSchedule] = useState<string>("");

  const handleGenerateReport = async () => {
    if (!companyId || !month) {
      setError("Selecione o mês");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reports/monthly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, month, position: position || undefined, workSchedule: workSchedule || undefined }),
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

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
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
        "Taxa Presença"
      ],
      ...data.employees.map((employee) => {
        const attendanceRate = employee.monthlyCalculation.workDays > 0
          ? ((employee.monthlyCalculation.completeDays / employee.monthlyCalculation.workDays) * 100).toFixed(1) + "%"
          : "0%";
        return [
          employee.name,
          employee.position,
          employee.workSchedule,
          employee.monthlyCalculation.workDays,
          employee.monthlyCalculation.totalRegularFormatted,
          employee.monthlyCalculation.totalOvertimeFormatted,
          employee.monthlyCalculation.totalDelayFormatted,
          employee.monthlyCalculation.totalEarlyDepartureFormatted,
          attendanceRate
        ];
      })
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório Mensal");
    XLSX.writeFile(wb, `relatorio-mensal-${data.month}.xlsx`);
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
        "Taxa Presença"
      ],
      ...data.employees.map((employee) => {
        const attendanceRate = employee.monthlyCalculation.workDays > 0
          ? ((employee.monthlyCalculation.completeDays / employee.monthlyCalculation.workDays) * 100).toFixed(1) + "%"
          : "0%";
        return [
          employee.name,
          employee.position,
          employee.workSchedule,
          employee.monthlyCalculation.workDays,
          employee.monthlyCalculation.totalRegularFormatted,
          employee.monthlyCalculation.totalOvertimeFormatted,
          employee.monthlyCalculation.totalDelayFormatted,
          employee.monthlyCalculation.totalEarlyDepartureFormatted,
          attendanceRate
        ];
      })
    ];
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio-mensal-${data.month}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!data) return;
    exportMonthlyReportToPDF(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Relatório Mensal Geral
          </CardTitle>
          <CardDescription>
            Relatório consolidado mensal com dados de todos os funcionários da empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Mês</Label>
              <Input
                id="month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Setor/Cargo</Label>
              <Input
                id="position"
                type="text"
                placeholder="Ex: Técnico, Administrativo..."
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workSchedule">Jornada</Label>
              <select
                id="workSchedule"
                className="w-full border rounded px-2 py-2"
                value={workSchedule}
                onChange={(e) => setWorkSchedule(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="PRESENCIAL">Presencial</option>
                <option value="HOME_OFFICE">Home Office</option>
                <option value="HYBRID">Híbrida</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleGenerateReport} disabled={isLoading} className="w-full">
                {isLoading ? "Gerando..." : "Gerar Relatório"}
              </Button>
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
                Resumo Executivo - {formatMonth(data.month)}
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
                    {data.totals.totalSalaryFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Salários</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métricas de Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Métricas de Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {data.totals.attendanceRate}
                  </div>
                  <div className="text-sm text-muted-foreground">Taxa de Presença</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.totals.punctualityRate}
                  </div>
                  <div className="text-sm text-muted-foreground">Taxa de Pontualidade</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
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
                      <TableHead className="text-right">Dias Trabalhados</TableHead>
                      <TableHead className="text-right">Horas Regulares</TableHead>
                      <TableHead className="text-right">Horas Extras</TableHead>
                      <TableHead className="text-right">Atrasos</TableHead>
                      <TableHead className="text-right">Saídas Antecipadas</TableHead>
                      <TableHead className="text-right">Taxa Presença</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.employees.map((employee) => {
                      const attendanceRate = employee.monthlyCalculation.workDays > 0 
                        ? ((employee.monthlyCalculation.completeDays / employee.monthlyCalculation.workDays) * 100).toFixed(1) + '%'
                        : '0%';
                      
                      return (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            {employee.name}
                          </TableCell>
                          <TableCell>{employee.position}</TableCell>
                          <TableCell>{employee.workSchedule}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">
                              {employee.monthlyCalculation.workDays}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">
                              {employee.monthlyCalculation.totalRegularFormatted}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="text-orange-600">
                              {employee.monthlyCalculation.totalOvertimeFormatted}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="destructive">
                              {employee.monthlyCalculation.totalDelayFormatted}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="destructive">
                              {employee.monthlyCalculation.totalEarlyDepartureFormatted}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              variant={parseFloat(attendanceRate) >= 90 ? "default" : "destructive"}
                            >
                              {attendanceRate}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Alertas */}
          {data.employees.some(emp => emp.monthlyCalculation.lateDays > 5) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Atenção: Alguns funcionários possuem muitos atrasos no mês.
              </AlertDescription>
            </Alert>
          )}

          {data.employees.some(emp => emp.monthlyCalculation.totalOvertimeMinutes > 600) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Atenção: Alguns funcionários excederam o limite de horas extras (10h/semana).
              </AlertDescription>
            </Alert>
          )}

          {parseFloat(data.totals.attendanceRate) < 85 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Taxa de presença da empresa está abaixo de 85%. Considere ações para melhorar.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
} 