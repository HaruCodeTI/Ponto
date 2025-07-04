"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, CalendarIcon, AlertTriangle, Clock } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { exportToPDF } from "@/lib/pdf-export";

interface ProductivityReportProps {
  companyId?: string;
}

interface ProductivityData {
  id: string;
  name: string;
  email: string;
  position: string;
  workSchedule: string;
  daysWorked: number;
  totalContractedHours: number;
  totalWorkedHours: number;
  totalOvertime: number;
  totalDelays: number;
  totalEarlyDepartures: number;
  totalAbsences: number;
  efficiency: number;
  presenceRate: number;
}

export function ProductivityReport({ companyId }: ProductivityReportProps) {
  const [data, setData] = useState<ProductivityData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<"month" | "period">("month");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/reports/productivity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          month: reportType === "month" ? month : undefined,
          startDate: reportType === "period" ? startDate : undefined,
          endDate: reportType === "period" ? endDate : undefined,
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
    if (!data.length) return;
    const wsData = [
      [
        "Funcionário",
        "Cargo",
        "Jornada",
        "Dias Trabalhados",
        "Horas Contratadas",
        "Horas Trabalhadas",
        "Horas Extras",
        "Atrasos",
        "Saídas Antecipadas",
        "Faltas",
        "Eficiência (%)",
        "Presença (%)"
      ],
      ...data.map((item) => [
        item.name,
        item.position,
        item.workSchedule,
        item.daysWorked,
        item.totalContractedHours,
        item.totalWorkedHours.toFixed(2),
        item.totalOvertime.toFixed(2),
        item.totalDelays,
        item.totalEarlyDepartures,
        item.totalAbsences,
        item.efficiency,
        item.presenceRate
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtividade");
    XLSX.writeFile(wb, `relatorio-produtividade.xlsx`);
  };

  const handleExportCSV = () => {
    if (!data.length) return;
    const csvData = [
      [
        "Funcionário",
        "Cargo",
        "Jornada",
        "Dias Trabalhados",
        "Horas Contratadas",
        "Horas Trabalhadas",
        "Horas Extras",
        "Atrasos",
        "Saídas Antecipadas",
        "Faltas",
        "Eficiência (%)",
        "Presença (%)"
      ],
      ...data.map((item) => [
        item.name,
        item.position,
        item.workSchedule,
        item.daysWorked,
        item.totalContractedHours,
        item.totalWorkedHours.toFixed(2),
        item.totalOvertime.toFixed(2),
        item.totalDelays,
        item.totalEarlyDepartures,
        item.totalAbsences,
        item.efficiency,
        item.presenceRate
      ])
    ];
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio-produtividade.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!data.length) return;
    const headers = [
      "Funcionário",
      "Cargo",
      "Jornada",
      "Dias Trabalhados",
      "Horas Contratadas",
      "Horas Trabalhadas",
      "Horas Extras",
      "Atrasos",
      "Saídas Antecipadas",
      "Faltas",
      "Eficiência (%)",
      "Presença (%)"
    ];
    const tableData = data.map((item) => [
      item.name,
      item.position,
      item.workSchedule,
      item.daysWorked.toString(),
      item.totalContractedHours.toString(),
      item.totalWorkedHours.toFixed(2),
      item.totalOvertime.toFixed(2),
      item.totalDelays.toString(),
      item.totalEarlyDepartures.toString(),
      item.totalAbsences.toString(),
      item.efficiency.toString(),
      item.presenceRate.toString()
    ]);
    exportToPDF({
      title: "Relatório de Produtividade",
      data: tableData,
      headers,
      filename: `relatorio-produtividade.pdf`,
      orientation: "landscape"
    });
  };

  // Resumo
  const totalFuncionarios = data.length;
  const mediaEficiência = totalFuncionarios ? Math.round(data.reduce((sum, d) => sum + d.efficiency, 0) / totalFuncionarios) : 0;
  const mediaPresença = totalFuncionarios ? Math.round(data.reduce((sum, d) => sum + d.presenceRate, 0) / totalFuncionarios) : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Relatório de Produtividade
          </CardTitle>
          <CardDescription>
            Analise a produtividade dos funcionários: presença, eficiência, atrasos, faltas e horas extras.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={(value: "month" | "period") => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Mensal</SelectItem>
                  <SelectItem value="period">Período</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Período</Label>
              {reportType === "month" ? (
                <Input
                  id="month"
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Início"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="Fim"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleGenerateReport} disabled={isLoading}>
              {isLoading ? "Gerando..." : "Gerar Relatório"}
            </Button>
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
                Resumo Executivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {totalFuncionarios}
                  </div>
                  <div className="text-sm text-muted-foreground">Funcionários</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {mediaEficiência}%
                  </div>
                  <div className="text-sm text-muted-foreground">Média Eficiência</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {mediaPresença}%
                  </div>
                  <div className="text-sm text-muted-foreground">Média Presença</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Produtividade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Produtividade por Funcionário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Jornada</TableHead>
                      <TableHead className="text-right">Dias Trabalhados</TableHead>
                      <TableHead className="text-right">Horas Contratadas</TableHead>
                      <TableHead className="text-right">Horas Trabalhadas</TableHead>
                      <TableHead className="text-right">Horas Extras</TableHead>
                      <TableHead className="text-right">Atrasos</TableHead>
                      <TableHead className="text-right">Saídas Antecipadas</TableHead>
                      <TableHead className="text-right">Faltas</TableHead>
                      <TableHead className="text-right">Eficiência</TableHead>
                      <TableHead className="text-right">Presença</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.position}</TableCell>
                        <TableCell>{item.workSchedule}</TableCell>
                        <TableCell className="text-right">{item.daysWorked}</TableCell>
                        <TableCell className="text-right">{item.totalContractedHours}</TableCell>
                        <TableCell className="text-right">{item.totalWorkedHours.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.totalOvertime.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.totalDelays}</TableCell>
                        <TableCell className="text-right">{item.totalEarlyDepartures}</TableCell>
                        <TableCell className="text-right">{item.totalAbsences}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={item.efficiency >= 95 ? "default" : item.efficiency >= 80 ? "secondary" : "destructive"}>
                            {item.efficiency}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={item.presenceRate >= 95 ? "default" : item.presenceRate >= 80 ? "secondary" : "destructive"}>
                            {item.presenceRate}%
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
          {mediaEficiência < 80 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Atenção: A média de eficiência está baixa ({mediaEficiência}%).
                Recomenda-se revisar a jornada e os processos dos funcionários.
              </AlertDescription>
            </Alert>
          )}
          {mediaPresença < 80 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Atenção: A média de presença está baixa ({mediaPresença}%).
                Recomenda-se revisar faltas e atrasos recorrentes.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
} 