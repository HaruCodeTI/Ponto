"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, RefreshCw, BarChart2, Calendar, Users, FileText } from "lucide-react";
import { generateTimeRecordReport, exportTimeRecordReport } from "@/lib/time-record-reports";
import { 
  TimeRecordReportFilters, 
  ReportType, 
  TimeRecordReportResponse 
} from "@/types/time-record";

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: "DAILY_SUMMARY", label: "Resumo Diário" },
  { value: "WEEKLY_SUMMARY", label: "Resumo Semanal" },
  { value: "MONTHLY_SUMMARY", label: "Resumo Mensal" },
  { value: "EMPLOYEE_DETAILED", label: "Detalhado por Funcionário" },
  { value: "COMPANY_OVERVIEW", label: "Visão Geral da Empresa" },
  { value: "ATTENDANCE_ANALYSIS", label: "Análise de Presença" },
  { value: "OVERTIME_REPORT", label: "Horas Extras" },
  { value: "LATE_ARRIVALS", label: "Atrasos" },
  { value: "EARLY_DEPARTURES", label: "Saídas Antecipadas" },
  { value: "ABSENCES", label: "Ausências" },
];

interface TimeRecordReportTableProps {
  companyId?: string;
  employeeId?: string;
}

export function TimeRecordReportTable({ companyId, employeeId }: TimeRecordReportTableProps) {
  const [filters, setFilters] = useState<TimeRecordReportFilters>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 14)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reportType: "DAILY_SUMMARY",
    companyId,
    employeeId,
  });
  const [report, setReport] = useState<TimeRecordReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateTimeRecordReport(filters);
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "CSV" | "JSON" | "PDF" | "EXCEL") => {
    if (!report) return;
    setExporting(true);
    try {
      const url = await exportTimeRecordReport(report, { format });
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio_ponto.${format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" /> Relatório de Ponto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium">Tipo de Relatório</label>
              <Select
                value={filters.reportType}
                onValueChange={value => setFilters(f => ({ ...f, reportType: value as ReportType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map(rt => (
                    <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Data Inicial</label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={filters.startDate}
                onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Data Final</label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={filters.endDate}
                onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleGenerate} disabled={loading} className="w-full">
                <RefreshCw className={loading ? "animate-spin h-4 w-4 mr-2" : "h-4 w-4 mr-2"} />
                Gerar Relatório
              </Button>
              <Button variant="outline" onClick={() => handleExport("CSV") } disabled={!report || exporting}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport("JSON") } disabled={!report || exporting}>
                <FileText className="h-4 w-4 mr-1" /> JSON
              </Button>
            </div>
          </div>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {report && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" /> Período: {filters.startDate} a {filters.endDate}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{report.stats.totalEmployees}</div>
                      <div className="text-sm text-gray-600">Funcionários</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{report.stats.totalHours.toFixed(1)}</div>
                      <div className="text-sm text-gray-600">Horas Totais</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{report.stats.totalOvertime.toFixed(1)}</div>
                      <div className="text-sm text-gray-600">Horas Extras</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{report.stats.totalLates}</div>
                      <div className="text-sm text-gray-600">Atrasos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> Detalhamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Funcionário</TableHead>
                          <TableHead>Departamento</TableHead>
                          <TableHead>Horas</TableHead>
                          <TableHead>Extras</TableHead>
                          <TableHead>Atraso</TableHead>
                          <TableHead>Saída Antecipada</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.data.map(item => (
                          <TableRow key={item.employeeId + item.date}>
                            <TableCell>{item.date}</TableCell>
                            <TableCell>{item.employeeName}</TableCell>
                            <TableCell>{item.department}</TableCell>
                            <TableCell>{item.totalHours.toFixed(2)}</TableCell>
                            <TableCell>{item.overtimeHours.toFixed(2)}</TableCell>
                            <TableCell>{item.isLate ? "Sim" : "Não"}</TableCell>
                            <TableCell>{item.isEarlyDeparture ? "Sim" : "Não"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 