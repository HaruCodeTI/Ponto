"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, DollarSign, AlertTriangle, Users } from "lucide-react";
import Papa from "papaparse";
import { exportPayrollReportToPDF } from "@/lib/pdf-export";

interface PayrollReportProps {
  companyId?: string;
}

interface PayrollEmployee {
  id: string;
  name: string;
  position?: string;
  salary: number;
  monthlyCalculation: {
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
  proportionalSalary: {
    baseSalary: number;
    proportionalSalary: number;
    overtimeValue: number;
    nightShiftValue: number;
    absencesDiscount: number;
    latesDiscount: number;
    earlyDeparturesDiscount: number;
    totalDiscounts: number;
    finalSalary: number;
    baseSalaryFormatted: string;
    proportionalSalaryFormatted: string;
    overtimeValueFormatted: string;
    nightShiftValueFormatted: string;
    absencesDiscountFormatted: string;
    latesDiscountFormatted: string;
    earlyDeparturesDiscountFormatted: string;
    totalDiscountsFormatted: string;
    finalSalaryFormatted: string;
  };
  workTimeBank: {
    totalCredits: number;
    totalDebits: number;
    balance: number;
    totalCreditsFormatted: string;
    totalDebitsFormatted: string;
    balanceFormatted: string;
  };
}

export function PayrollReport({ companyId: _companyId }: PayrollReportProps) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<PayrollEmployee[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePayroll = async () => {
    if (!month) {
      setError("Selecione o mês");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/salary/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Erro ao gerar folha de pagamento");
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

  const calculateTotals = () => {
    if (data.length === 0) return null;

    return {
      totalEmployees: data.length,
      totalBaseSalary: data.reduce((sum, emp) => sum + emp.proportionalSalary.baseSalary, 0),
      totalFinalSalary: data.reduce((sum, emp) => sum + emp.proportionalSalary.finalSalary, 0),
      totalOvertime: data.reduce((sum, emp) => sum + emp.proportionalSalary.overtimeValue, 0),
      totalNightShift: data.reduce((sum, emp) => sum + emp.proportionalSalary.nightShiftValue, 0),
      totalDiscounts: data.reduce((sum, emp) => sum + emp.proportionalSalary.totalDiscounts, 0),
      totalWorkTimeBank: data.reduce((sum, emp) => sum + emp.workTimeBank.balance, 0),
    };
  };

  const totals = calculateTotals();

  const handleExportCSV = () => {
    if (data.length === 0) return;
    const csvData = data.map(emp => ({
      "Funcionário": emp.name,
      "Salário Base": emp.proportionalSalary.baseSalaryFormatted,
      "Horas Regulares": emp.monthlyCalculation.totalRegularFormatted,
      "Horas Extras": emp.monthlyCalculation.totalOvertimeFormatted,
      "Adicional Noturno": emp.proportionalSalary.nightShiftValueFormatted,
      "Valor Horas Extras": emp.proportionalSalary.overtimeValueFormatted,
      "Desconto Faltas": emp.proportionalSalary.absencesDiscountFormatted,
      "Desconto Atrasos": emp.proportionalSalary.latesDiscountFormatted,
      "Desconto Saídas Antecipadas": emp.proportionalSalary.earlyDeparturesDiscountFormatted,
      "Total Descontos": emp.proportionalSalary.totalDiscountsFormatted,
      "Banco de Horas": emp.workTimeBank.balanceFormatted,
      "Salário Final": emp.proportionalSalary.finalSalaryFormatted,
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `folha_pagamento_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (data.length === 0) return;
    const reportData = {
      month: formatMonth(month),
      employees: data.map(emp => ({
        name: emp.name,
        position: emp.position || "N/A",
        salaryFormatted: emp.proportionalSalary.baseSalaryFormatted,
        hoursWorked: emp.monthlyCalculation.totalRegularFormatted,
        overtimeFormatted: emp.proportionalSalary.overtimeValueFormatted,
        nightShiftFormatted: emp.proportionalSalary.nightShiftValueFormatted,
        deductionsFormatted: emp.proportionalSalary.totalDiscountsFormatted,
        totalToReceiveFormatted: emp.proportionalSalary.finalSalaryFormatted,
      }))
    };
    exportPayrollReportToPDF(reportData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Folha de Pagamento
          </CardTitle>
          <CardDescription>
            Gere a folha de pagamento consolidada de todos os funcionários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Mês</Label>
              <Input
                id="month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleGeneratePayroll} disabled={isLoading} className="w-full">
                {isLoading ? "Gerando..." : "Gerar Folha"}
              </Button>
              <Button onClick={handleExportCSV} variant="outline" disabled={data.length === 0} className="w-full">
                Exportar CSV
              </Button>
              <Button onClick={handleExportPDF} variant="outline" disabled={data.length === 0} className="w-full">
                Exportar PDF
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

      {data.length > 0 && (
        <div className="space-y-6">
          {/* Resumo da Folha */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Resumo da Folha - {formatMonth(month)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {totals?.totalEmployees}
                  </div>
                  <div className="text-sm text-muted-foreground">Funcionários</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {totals?.totalFinalSalary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <div className="text-sm text-muted-foreground">Total a Pagar</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {totals?.totalOvertime.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Horas Extras</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {totals?.totalDiscounts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Descontos</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela da Folha */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Detalhamento por Funcionário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead className="text-right">Salário Base</TableHead>
                      <TableHead className="text-right">Horas Regulares</TableHead>
                      <TableHead className="text-right">Horas Extras</TableHead>
                      <TableHead className="text-right">Adicionais</TableHead>
                      <TableHead className="text-right">Descontos</TableHead>
                      <TableHead className="text-right">Banco de Horas</TableHead>
                      <TableHead className="text-right">Salário Final</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          {employee.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {employee.proportionalSalary.baseSalaryFormatted}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">
                            {employee.monthlyCalculation.totalRegularFormatted}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-orange-600">
                            {employee.monthlyCalculation.totalOvertimeFormatted}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-purple-600">
                                {employee.proportionalSalary.nightShiftValueFormatted}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-green-600">
                                {employee.proportionalSalary.overtimeValueFormatted}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <div className="text-sm text-red-600">
                              -{employee.proportionalSalary.absencesDiscountFormatted}
                            </div>
                            <div className="text-sm text-red-600">
                              -{employee.proportionalSalary.latesDiscountFormatted}
                            </div>
                            <div className="text-sm text-red-600">
                              -{employee.proportionalSalary.earlyDeparturesDiscountFormatted}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={employee.workTimeBank.balance >= 0 ? "outline" : "destructive"}
                            className={employee.workTimeBank.balance >= 0 ? "text-green-600" : ""}
                          >
                            {employee.workTimeBank.balanceFormatted}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {employee.proportionalSalary.finalSalaryFormatted}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Alertas */}
          {data.some(emp => emp.workTimeBank.balance < 0) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Atenção: Alguns funcionários possuem saldo negativo no banco de horas.
              </AlertDescription>
            </Alert>
          )}

          {data.some(emp => emp.monthlyCalculation.totalOvertimeMinutes > 600) && (
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