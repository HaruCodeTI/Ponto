"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, DollarSign, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface ProportionalSalaryCalculatorProps {
  employeeId: string;
  employeeName?: string;
}

interface ProportionalSalaryResult {
  employeeId: string;
  period: string;
  baseSalary: number;
  proportionalSalary: number;
  totalWorkedHours: number;
  totalExpectedHours: number;
  attendanceRate: number;
  absences: number;
  lates: number;
  earlyDepartures: number;
  overtimeHours: number;
  nightShiftHours: number;
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
  warnings: string[];
  errors: string[];
}

export function ProportionalSalaryCalculator({ employeeId, employeeName }: ProportionalSalaryCalculatorProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProportionalSalaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState<string>('');
  const [baseSalary, setBaseSalary] = useState<string>('');

  const calculateSalary = async () => {
    if (!month) {
      setError("Selecione o mês");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/salary/proportional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          employeeId, 
          month, 
          baseSalary: baseSalary ? parseFloat(baseSalary) : undefined 
        }),
      });
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Erro ao calcular salário proporcional");
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Salário Proporcional
          </CardTitle>
          <CardDescription>
            Calcule o salário proporcional de {employeeName || `Funcionário ${employeeId}`} baseado em horas trabalhadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Mês</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Salário Base (opcional)</label>
              <input
                type="number"
                placeholder="2000"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={calculateSalary} disabled={loading} className="w-full flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                {loading ? "Calculando..." : "Calcular Salário"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Salário Proporcional - {new Date(result.period + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <CardDescription>
              Cálculo baseado em {result.totalWorkedHours.toFixed(1)}h trabalhadas de {result.totalExpectedHours.toFixed(1)}h esperadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resumo Principal */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {result.baseSalaryFormatted}
                </div>
                <div className="text-sm text-gray-600">Salário Base</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {result.proportionalSalaryFormatted}
                </div>
                <div className="text-sm text-gray-600">Salário Proporcional</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {result.finalSalaryFormatted}
                </div>
                <div className="text-sm text-gray-600">Salário Final</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {result.attendanceRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Taxa de Presença</div>
              </div>
            </div>

            <Separator />

            {/* Detalhamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Adicionais */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Adicionais
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">Horas Extras ({result.overtimeHours.toFixed(1)}h)</span>
                    <span className="font-medium text-green-600">{result.overtimeValueFormatted}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm">Adicional Noturno ({result.nightShiftHours.toFixed(1)}h)</span>
                    <span className="font-medium text-blue-600">{result.nightShiftValueFormatted}</span>
                  </div>
                </div>
              </div>

              {/* Descontos */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Descontos
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm">Faltas ({result.absences})</span>
                    <span className="font-medium text-red-600">{result.absencesDiscountFormatted}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm">Atrasos ({result.lates})</span>
                    <span className="font-medium text-yellow-600">{result.latesDiscountFormatted}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm">Saídas Antecipadas ({result.earlyDepartures})</span>
                    <span className="font-medium text-orange-600">{result.earlyDeparturesDiscountFormatted}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-2">
                    <span className="text-sm font-medium">Total de Descontos</span>
                    <span className="font-bold text-gray-800">{result.totalDiscountsFormatted}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Avisos */}
            {result.warnings.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-yellow-800">
                  {result.warnings.map((warning, i) => (
                    <div key={i}>⚠️ {warning}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 