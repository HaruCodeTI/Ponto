"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, Calculator, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { formatMinutes } from "@/lib/salary-calculations";

interface WorkHoursCalculatorProps {
  employeeId: string;
  employeeName?: string;
}

interface CalculationSummary {
  totalDays?: number;
  completeDays?: number;
  totalRegularMinutes: number;
  totalOvertimeMinutes: number;
  totalBreakMinutes: number;
  totalDelayMinutes?: number;
  totalEarlyDepartureMinutes?: number;
}

interface CalculationResult {
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  employeeId: string;
  startDate: string;
  endDate: string;
  calculations: CalculationDetail[];
  summary: CalculationSummary;
}

interface CalculationDetail {
  date?: string;
  weekStart?: string;
  month?: string;
  isComplete?: boolean;
  hasOvertime?: boolean;
  overtimeMinutes?: number;
  totalOvertimeMinutes?: number;
  regularMinutes?: number;
  totalRegularMinutes?: number;
  breakMinutes?: number;
  totalBreakMinutes?: number;
  isLate?: boolean;
  isEarlyDeparture?: boolean;
  warnings?: string[];
  errors?: string[];
}

export function WorkHoursCalculator({ employeeId, employeeName }: WorkHoursCalculatorProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calculationType, setCalculationType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const calculateHours = async () => {
    if (!startDate || !endDate) {
      setError("Selecione as datas de início e fim");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/salary/calculate-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          startDate,
          endDate,
          calculationType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Erro ao calcular horas trabalhadas");
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const getCalculationTypeLabel = (type: string) => {
    switch (type) {
      case 'DAILY': return 'Diário';
      case 'WEEKLY': return 'Semanal';
      case 'MONTHLY': return 'Mensal';
      default: return type;
    }
  };

  const getStatusIcon = (calculation: CalculationDetail) => {
    if (calculation.errors && calculation.errors.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (calculation.warnings && calculation.warnings.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusColor = (calculation: CalculationDetail) => {
    if (calculation.errors && calculation.errors.length > 0) {
      return "text-red-600";
    }
    if (calculation.warnings && calculation.warnings.length > 0) {
      return "text-yellow-600";
    }
    return "text-green-600";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Horas Trabalhadas
          </CardTitle>
          <CardDescription>
            Calcule as horas trabalhadas por período para {employeeName || `Funcionário ${employeeId}`}
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Cálculo</label>
              <select
                value={calculationType}
                onChange={(e) => setCalculationType(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY')}
                className="w-full p-2 border rounded-md"
              >
                <option value="DAILY">Diário</option>
                <option value="WEEKLY">Semanal</option>
                <option value="MONTHLY">Mensal</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Data Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Data Fim</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={calculateHours} 
                disabled={loading}
                className="w-full flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" />
                {loading ? "Calculando..." : "Calcular"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resultado - {getCalculationTypeLabel(result.type)}
            </CardTitle>
            <CardDescription>
              Período: {new Date(result.startDate).toLocaleDateString('pt-BR')} a {new Date(result.endDate).toLocaleDateString('pt-BR')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatMinutes(result.summary.totalRegularMinutes)}
                </div>
                <div className="text-sm text-gray-600">Horas Regulares</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {formatMinutes(result.summary.totalOvertimeMinutes)}
                </div>
                <div className="text-sm text-gray-600">Horas Extras</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatMinutes(result.summary.totalBreakMinutes)}
                </div>
                <div className="text-sm text-gray-600">Intervalos</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {result.summary.totalDays || 0}
                </div>
                <div className="text-sm text-gray-600">Dias Trabalhados</div>
              </div>
            </div>

            <Separator />

            {/* Detalhes por período */}
            <div>
              <h3 className="text-lg font-medium mb-4">Detalhes por {getCalculationTypeLabel(result.type).toLowerCase()}</h3>
              <div className="space-y-3">
                {result.calculations.map((calculation, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(calculation)}
                          <span className="font-medium">
                            {calculation.date || calculation.weekStart || calculation.month}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {calculation.isComplete ? "Completo" : "Incompleto"}
                          </Badge>
                          {calculation.hasOvertime && (
                            <Badge variant="outline" className="text-xs text-orange-600">
                              +{formatMinutes(calculation.overtimeMinutes || calculation.totalOvertimeMinutes || 0)}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <Clock className="h-3 w-3 inline mr-1" />
                            Regular: {formatMinutes(calculation.regularMinutes || calculation.totalRegularMinutes || 0)}
                          </div>
                          <div>
                            <TrendingUp className="h-3 w-3 inline mr-1" />
                            Extras: {formatMinutes(calculation.overtimeMinutes || calculation.totalOvertimeMinutes || 0)}
                          </div>
                          <div>
                            <Calendar className="h-3 w-3 inline mr-1" />
                            Intervalo: {formatMinutes(calculation.breakMinutes || calculation.totalBreakMinutes || 0)}
                          </div>
                          <div>
                            <span className={getStatusColor(calculation)}>
                              {calculation.isLate ? "Atraso" : calculation.isEarlyDeparture ? "Saída Antecipada" : "No Horário"}
                            </span>
                          </div>
                        </div>

                        {/* Avisos e erros */}
                        {((calculation.warnings?.length ?? 0) > 0 || (calculation.errors?.length ?? 0) > 0) && (
                          <div className="mt-2 space-y-1">
                            {calculation.errors?.map((error: string, i: number) => (
                              <div key={i} className="text-xs text-red-600">❌ {error}</div>
                            ))}
                            {calculation.warnings?.map((warning: string, i: number) => (
                              <div key={i} className="text-xs text-yellow-600">⚠️ {warning}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 