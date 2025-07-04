"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, DollarSign, Clock, AlertTriangle, TrendingUp } from "lucide-react";

interface SalarySummaryProps {
  employeeId?: string;
}

interface SalarySummaryData {
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
    credits: Array<{
      type: string;
      minutes: number;
      minutesFormatted: string;
    }>;
    debits: Array<{
      type: string;
      minutes: number;
      minutesFormatted: string;
    }>;
  };
}

export function SalarySummary({ employeeId }: SalarySummaryProps) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [baseSalary, setBaseSalary] = useState("1320.00");
  const [employeeIdInput, setEmployeeIdInput] = useState(employeeId || "");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<SalarySummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    if (!employeeIdInput || !month) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/salary/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employeeIdInput,
          month,
          baseSalary: parseFloat(baseSalary) || 1320.00,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Erro ao calcular resumo salarial");
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Resumo Salarial Unificado
          </CardTitle>
          <CardDescription>
            Visualize todos os cálculos salariais do funcionário em um único relatório
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">ID do Funcionário</Label>
              <Input
                id="employeeId"
                value={employeeIdInput}
                onChange={(e) => setEmployeeIdInput(e.target.value)}
                placeholder="Digite o ID do funcionário"
              />
            </div>
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
              <Label htmlFor="baseSalary">Salário Base (R$)</Label>
              <Input
                id="baseSalary"
                type="number"
                step="0.01"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                placeholder="1320.00"
              />
            </div>
          </div>
          <Button onClick={handleCalculate} disabled={isLoading} className="w-full">
            {isLoading ? "Calculando..." : "Calcular Resumo"}
          </Button>
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
          {/* Cabeçalho do Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Resumo de {formatMonth(month)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {data.proportionalSalary.finalSalaryFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">Salário Final</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.monthlyCalculation.totalRegularFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">Horas Regulares</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {data.monthlyCalculation.totalOvertimeFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">Horas Extras</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${data.workTimeBank.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.workTimeBank.balanceFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">Banco de Horas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Horas Trabalhadas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horas Trabalhadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Horas Regulares:</span>
                  <Badge variant="secondary">{data.monthlyCalculation.totalRegularFormatted}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Horas Extras:</span>
                  <Badge variant="outline" className="text-orange-600">
                    {data.monthlyCalculation.totalOvertimeFormatted}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Adicional Noturno:</span>
                  <Badge variant="outline" className="text-purple-600">
                    {data.monthlyCalculation.totalNightShiftFormatted}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Intervalos:</span>
                  <Badge variant="outline">{data.monthlyCalculation.totalBreakFormatted}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Atrasos:</span>
                  <Badge variant="destructive">{data.monthlyCalculation.totalDelayFormatted}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Saídas Antecipadas:</span>
                  <Badge variant="destructive">{data.monthlyCalculation.totalEarlyDepartureFormatted}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Salário Proporcional */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cálculo Salarial
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Salário Base:</span>
                  <Badge variant="secondary">{data.proportionalSalary.baseSalaryFormatted}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Salário Proporcional:</span>
                  <Badge variant="secondary">{data.proportionalSalary.proportionalSalaryFormatted}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Valor Horas Extras:</span>
                  <Badge variant="outline" className="text-green-600">
                    {data.proportionalSalary.overtimeValueFormatted}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Adicional Noturno:</span>
                  <Badge variant="outline" className="text-purple-600">
                    {data.proportionalSalary.nightShiftValueFormatted}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Desconto Faltas:</span>
                  <Badge variant="destructive">-{data.proportionalSalary.absencesDiscountFormatted}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Desconto Atrasos:</span>
                  <Badge variant="destructive">-{data.proportionalSalary.latesDiscountFormatted}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Desconto Saídas Antecipadas:</span>
                  <Badge variant="destructive">-{data.proportionalSalary.earlyDeparturesDiscountFormatted}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Salário Final:</span>
                  <Badge className="text-lg">{data.proportionalSalary.finalSalaryFormatted}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Banco de Horas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Banco de Horas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {data.workTimeBank.totalCreditsFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">Total de Créditos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {data.workTimeBank.totalDebitsFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">Total de Débitos</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${data.workTimeBank.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.workTimeBank.balanceFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">Saldo Final</div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-green-600">Créditos</h4>
                  <div className="space-y-2">
                    {data.workTimeBank.credits.map((credit, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{credit.type}:</span>
                        <Badge variant="outline" className="text-green-600">
                          {credit.minutesFormatted}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-red-600">Débitos</h4>
                  <div className="space-y-2">
                    {data.workTimeBank.debits.map((debit, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{debit.type}:</span>
                        <Badge variant="outline" className="text-red-600">
                          {debit.minutesFormatted}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {data.workTimeBank.balance < 0 && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Atenção: Saldo negativo no banco de horas. Considere compensar as horas em débito.
                  </AlertDescription>
                </Alert>
              )}

              {data.workTimeBank.balance > 240 && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Saldo elevado no banco de horas. Considere utilizar ou pagar as horas extras acumuladas.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 