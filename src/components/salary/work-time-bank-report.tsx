"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, TrendingUp, TrendingDown, AlertTriangle, Calendar } from "lucide-react";

interface WorkTimeBankReportProps {
  employeeId: string;
  employeeName?: string;
}

interface CreditDebit {
  date: string;
  minutes: number;
  reason: string;
  minutesFormatted: string;
}

interface WorkTimeBankResult {
  employeeId: string;
  period: string;
  totalCredits: number;
  totalDebits: number;
  balance: number;
  totalCreditsFormatted: string;
  totalDebitsFormatted: string;
  balanceFormatted: string;
  credits: CreditDebit[];
  debits: CreditDebit[];
  warnings: string[];
  errors: string[];
}

export function WorkTimeBankReport({ employeeId, employeeName }: WorkTimeBankReportProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WorkTimeBankResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState<string>('');

  const fetchReport = async () => {
    if (!month) {
      setError("Selecione o mês");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/salary/work-time-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, month }),
      });
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Erro ao gerar relatório de banco de horas");
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
            <Clock className="h-5 w-5" />
            Banco de Horas
          </CardTitle>
          <CardDescription>
            Visualize o saldo de banco de horas de {employeeName || `Funcionário ${employeeId}`}
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
            <div className="flex items-end">
              <Button onClick={fetchReport} disabled={loading} className="w-full flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {loading ? "Calculando..." : "Gerar Relatório"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Banco de Horas - {new Date(result.period + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <CardDescription>
              Saldo: <span className={result.balance < 0 ? 'text-red-600' : 'text-green-600'}>{result.balanceFormatted}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {result.totalCreditsFormatted}
                </div>
                <div className="text-sm text-gray-600">Créditos (extras)</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {result.totalDebitsFormatted}
                </div>
                <div className="text-sm text-gray-600">Débitos</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className={`text-2xl font-bold ${result.balance < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                  {result.balanceFormatted}
                </div>
                <div className="text-sm text-gray-600">Saldo Final</div>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Créditos */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Créditos (Horas Extras)
                </h3>
                <div className="space-y-2">
                  {result.credits.length === 0 && <div className="text-gray-500 text-sm">Nenhum crédito no período</div>}
                  {result.credits.map((credit, i) => (
                    <div key={i} className="flex items-center gap-4 p-2 border rounded-md bg-green-50">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="font-mono text-sm w-28">{new Date(credit.date).toLocaleDateString('pt-BR')}</span>
                      <span className="text-green-700 text-xs font-medium">{credit.minutesFormatted}</span>
                      <span className="text-xs ml-2">{credit.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Débitos */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Débitos (Atrasos, Faltas, Saídas)
                </h3>
                <div className="space-y-2">
                  {result.debits.length === 0 && <div className="text-gray-500 text-sm">Nenhum débito no período</div>}
                  {result.debits.map((debit, i) => (
                    <div key={i} className="flex items-center gap-4 p-2 border rounded-md bg-red-50">
                      <Calendar className="h-4 w-4 text-red-600" />
                      <span className="font-mono text-sm w-28">{new Date(debit.date).toLocaleDateString('pt-BR')}</span>
                      <span className="text-red-700 text-xs font-medium">{debit.minutesFormatted}</span>
                      <span className="text-xs ml-2">{debit.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Avisos */}
            {result.warnings.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50 mt-4">
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