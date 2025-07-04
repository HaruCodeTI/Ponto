"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface OvertimeReportProps {
  employeeId: string;
  employeeName?: string;
}

interface OvertimeDay {
  date: string;
  overtimeMinutes: number;
  overtime: string;
}

interface OvertimeReportResult {
  employeeId: string;
  startDate: string;
  endDate: string;
  overtimeByDay: OvertimeDay[];
  totalOvertimeMinutes: number;
  totalOvertime: string;
  exceeded: boolean;
  recommendations: string[];
}

export function OvertimeReport({ employeeId, employeeName }: OvertimeReportProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OvertimeReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      setError("Selecione as datas de início e fim");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/salary/overtime-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, startDate, endDate }),
      });
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Erro ao gerar relatório de horas extras");
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
            <TrendingUp className="h-5 w-5" />
            Relatório de Horas Extras
          </CardTitle>
          <CardDescription>
            Visualize as horas extras de {employeeName || `Funcionário ${employeeId}`}
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
              <Button onClick={fetchReport} disabled={loading} className="w-full flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {loading ? "Gerando..." : "Gerar Relatório"}
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
              Horas Extras no Período
            </CardTitle>
            <CardDescription>
              {new Date(result.startDate).toLocaleDateString('pt-BR')} a {new Date(result.endDate).toLocaleDateString('pt-BR')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {result.totalOvertime}
                </div>
                <div className="text-sm text-gray-600">Total de Horas Extras</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {result.overtimeByDay.length}
                </div>
                <div className="text-sm text-gray-600">Dias com Horas Extras</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {result.exceeded ? <AlertTriangle className="inline h-5 w-5 text-red-500" /> : <CheckCircle className="inline h-5 w-5 text-green-500" />}
                </div>
                <div className="text-sm text-gray-600">Limite Legal</div>
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="text-lg font-medium mb-4">Detalhamento Diário</h3>
              <div className="space-y-2">
                {result.overtimeByDay.map((day, i) => (
                  <div key={i} className="flex items-center gap-4 p-2 border rounded-md">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="font-mono text-sm w-28">{new Date(day.date).toLocaleDateString('pt-BR')}</span>
                    <Badge variant={day.overtimeMinutes > 0 ? "outline" : "secondary"} className="text-xs">
                      {day.overtime}
                    </Badge>
                    {day.overtimeMinutes > 0 && (
                      <span className="text-orange-600 text-xs ml-2">+ Horas Extras</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {result.recommendations.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50 mt-4">
                <AlertDescription className="text-yellow-800">
                  {result.recommendations.map((rec, i) => (
                    <div key={i}>⚠️ {rec}</div>
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