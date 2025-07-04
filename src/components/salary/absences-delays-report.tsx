"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, AlertTriangle } from "lucide-react";

interface AbsencesDelaysReportProps {
  employeeId: string;
  employeeName?: string;
}

interface Delay {
  date: string;
  delayMinutes: number;
  delay: string;
  entryTime: string;
}

interface EarlyDeparture {
  date: string;
  earlyMinutes: number;
  earlyDeparture: string;
  exitTime: string;
}

interface Absence {
  date: string;
  reason: string;
}

interface AbsencesDelaysResult {
  employeeId: string;
  startDate: string;
  endDate: string;
  delays: Delay[];
  earlyDepartures: EarlyDeparture[];
  absences: Absence[];
  totalDelays: number;
  totalEarlyDepartures: number;
  totalAbsences: number;
}

export function AbsencesDelaysReport({ employeeId, employeeName }: AbsencesDelaysReportProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AbsencesDelaysResult | null>(null);
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
      const response = await fetch("/api/salary/absences-delays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, startDate, endDate }),
      });
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Erro ao gerar relatório de atrasos e faltas");
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
            <AlertTriangle className="h-5 w-5" />
            Relatório de Atrasos e Faltas
          </CardTitle>
          <CardDescription>
            Visualize atrasos, saídas antecipadas e faltas de {employeeName || `Funcionário ${employeeId}`}
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
                <AlertTriangle className="h-4 w-4" />
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
              Atrasos e Faltas no Período
            </CardTitle>
            <CardDescription>
              {new Date(result.startDate).toLocaleDateString('pt-BR')} a {new Date(result.endDate).toLocaleDateString('pt-BR')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {result.totalDelays}
                </div>
                <div className="text-sm text-gray-600">Atrasos</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {result.totalEarlyDepartures}
                </div>
                <div className="text-sm text-gray-600">Saídas Antecipadas</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {result.totalAbsences}
                </div>
                <div className="text-sm text-gray-600">Faltas</div>
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="text-lg font-medium mb-4">Detalhamento Diário</h3>
              <div className="space-y-2">
                {result.delays.map((delay, i) => (
                  <div key={i} className="flex items-center gap-4 p-2 border rounded-md bg-red-50">
                    <Calendar className="h-4 w-4 text-red-500" />
                    <span className="font-mono text-sm w-28">{new Date(delay.date).toLocaleDateString('pt-BR')}</span>
                    <Badge variant="outline" className="text-xs text-red-600">
                      {delay.delay}
                    </Badge>
                    <span className="text-red-600 text-xs ml-2">Atraso</span>
                  </div>
                ))}
                {result.earlyDepartures.map((early, i) => (
                  <div key={i} className="flex items-center gap-4 p-2 border rounded-md bg-yellow-50">
                    <Calendar className="h-4 w-4 text-yellow-500" />
                    <span className="font-mono text-sm w-28">{new Date(early.date).toLocaleDateString('pt-BR')}</span>
                    <Badge variant="outline" className="text-xs text-yellow-600">
                      {early.earlyDeparture}
                    </Badge>
                    <span className="text-yellow-600 text-xs ml-2">Saída Antecipada</span>
                  </div>
                ))}
                {result.absences.map((absence, i) => (
                  <div key={i} className="flex items-center gap-4 p-2 border rounded-md bg-orange-50">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span className="font-mono text-sm w-28">{new Date(absence.date).toLocaleDateString('pt-BR')}</span>
                    <Badge variant="outline" className="text-xs text-orange-600">
                      {absence.reason}
                    </Badge>
                    <span className="text-orange-600 text-xs ml-2">Falta</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 