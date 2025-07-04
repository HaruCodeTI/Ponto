"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, User, AlertTriangle, Calendar } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { exportIndividualReportToPDF } from "@/lib/pdf-export";

interface IndividualReportProps {
  companyId?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  workSchedule: string;
  salary: number;
  toleranceMinutes: number;
}

interface TimeRecord {
  id: string;
  type: string;
  time: string;
  timestamp: string;
  location: string;
  device: string;
}

interface DailyRecord {
  date: string;
  dateFormatted: string;
  dayOfWeek: string;
  records: TimeRecord[];
  entryTime: string | null;
  exitTime: string | null;
  breakStartTime: string | null;
  breakEndTime: string | null;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  overtimeMinutes: number;
  delayMinutes: number;
  earlyDepartureMinutes: number;
  hasWorked: boolean;
  isComplete: boolean;
  status: string;
  totalWorkFormatted: string;
  totalBreakFormatted: string;
  overtimeFormatted: string;
  delayFormatted: string;
  earlyDepartureFormatted: string;
}

interface IndividualReportData {
  employee: Employee;
  period: {
    startDate: string;
    endDate: string;
    reportPeriod: string;
  };
  dailyRecords: DailyRecord[];
  totals: {
    totalRegularMinutes: number;
    totalOvertimeMinutes: number;
    totalBreakMinutes: number;
    totalDelayMinutes: number;
    totalEarlyDepartureMinutes: number;
  };
  summary: {
    totalDays: number;
    totalWorkDays: number;
    totalRegularHours: string;
    totalOvertimeHours: string;
    totalBreakHours: string;
    totalDelayMinutes: number;
    totalEarlyDepartureMinutes: number;
    averageWorkHours: string;
    attendanceRate: string;
  };
}

export function IndividualReport({ companyId }: IndividualReportProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [reportType, setReportType] = useState<"daily" | "period">("daily");
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<IndividualReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Carregar lista de funcionários
  useEffect(() => {
    if (!companyId) return;

    const loadEmployees = async () => {
      try {
        const response = await fetch("/api/employee", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setEmployees(result.data);
            if (result.data.length > 0) {
              setSelectedEmployeeId(result.data[0].id);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar funcionários:", error);
      }
    };

    loadEmployees();
  }, [companyId]);

  const handleGenerateReport = async () => {
    if (!companyId || !selectedEmployeeId) {
      setError("Selecione um funcionário");
      return;
    }

    if (reportType === "daily" && !date) {
      setError("Selecione uma data");
      return;
    }

    if (reportType === "period" && (!startDate || !endDate)) {
      setError("Selecione o período");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reports/individual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          employeeId: selectedEmployeeId,
          date: reportType === "daily" ? date : undefined,
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
    if (!data) return;
    
    const wsData = [
      [
        "Data",
        "Dia da Semana",
        "Entrada",
        "Saída",
        "Pausa Início",
        "Pausa Fim",
        "Horas Trabalhadas",
        "Horas de Pausa",
        "Horas Extras",
        "Atrasos",
        "Saídas Antecipadas",
        "Status"
      ],
      ...data.dailyRecords.map((day) => [
        day.dateFormatted,
        day.dayOfWeek,
        day.entryTime || "-",
        day.exitTime || "-",
        day.breakStartTime || "-",
        day.breakEndTime || "-",
        day.totalWorkFormatted,
        day.totalBreakFormatted,
        day.overtimeFormatted,
        day.delayFormatted,
        day.earlyDepartureFormatted,
        day.status === "complete" ? "Completo" : day.status === "partial" ? "Parcial" : "Incompleto"
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório Individual");
    XLSX.writeFile(wb, `relatorio-individual-${data.employee.name}-${data.period.reportPeriod}.xlsx`);
  };

  const handleExportCSV = () => {
    if (!data) return;
    
    const csvData = [
      [
        "Data",
        "Dia da Semana",
        "Entrada",
        "Saída",
        "Pausa Início",
        "Pausa Fim",
        "Horas Trabalhadas",
        "Horas de Pausa",
        "Horas Extras",
        "Atrasos",
        "Saídas Antecipadas",
        "Status"
      ],
      ...data.dailyRecords.map((day) => [
        day.dateFormatted,
        day.dayOfWeek,
        day.entryTime || "-",
        day.exitTime || "-",
        day.breakStartTime || "-",
        day.breakEndTime || "-",
        day.totalWorkFormatted,
        day.totalBreakFormatted,
        day.overtimeFormatted,
        day.delayFormatted,
        day.earlyDepartureFormatted,
        day.status === "complete" ? "Completo" : day.status === "partial" ? "Parcial" : "Incompleto"
      ])
    ];

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio-individual-${data.employee.name}-${data.period.reportPeriod}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!data) return;
    exportIndividualReportToPDF(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Relatório Individual Diário
          </CardTitle>
          <CardDescription>
            Relatório detalhado de ponto de um funcionário específico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Funcionário</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportType">Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={(value: "daily" | "period") => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="period">Período</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {reportType === "daily" ? (
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

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

          {/* Informações do Funcionário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Funcionário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Nome</Label>
                  <p className="text-lg font-semibold">{data.employee.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Cargo</Label>
                  <p className="text-lg">{data.employee.position}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Jornada</Label>
                  <p className="text-lg">{data.employee.workSchedule}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo Executivo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Resumo Executivo - {data.period.reportPeriod}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.summary.totalWorkDays}
                  </div>
                  <div className="text-sm text-muted-foreground">Dias Trabalhados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {data.summary.totalRegularHours}
                  </div>
                  <div className="text-sm text-muted-foreground">Horas Regulares</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {data.summary.totalOvertimeHours}
                  </div>
                  <div className="text-sm text-muted-foreground">Horas Extras</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {data.summary.attendanceRate}
                  </div>
                  <div className="text-sm text-muted-foreground">Taxa de Presença</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhamento Diário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Detalhamento Diário ({data.dailyRecords.length} dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Dia</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead>Pausa</TableHead>
                      <TableHead className="text-right">Horas Trabalhadas</TableHead>
                      <TableHead className="text-right">Horas Extras</TableHead>
                      <TableHead className="text-right">Atrasos</TableHead>
                      <TableHead className="text-right">Saídas Antecipadas</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.dailyRecords.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell className="font-medium">
                          {day.dateFormatted}
                        </TableCell>
                        <TableCell className="capitalize">
                          {day.dayOfWeek}
                        </TableCell>
                        <TableCell>
                          {day.entryTime ? (
                            <Badge variant="outline" className="text-green-600">
                              {day.entryTime}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {day.exitTime ? (
                            <Badge variant="outline" className="text-red-600">
                              {day.exitTime}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {day.breakStartTime && day.breakEndTime ? (
                            <span className="text-sm">
                              {day.breakStartTime} - {day.breakEndTime}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">
                            {day.totalWorkFormatted}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {day.overtimeMinutes > 0 ? (
                            <Badge variant="outline" className="text-orange-600">
                              {day.overtimeFormatted}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {day.delayMinutes > 0 ? (
                            <Badge variant="destructive">
                              {day.delayFormatted}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {day.earlyDepartureMinutes > 0 ? (
                            <Badge variant="destructive">
                              {day.earlyDepartureFormatted}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              day.status === "complete" ? "default" : 
                              day.status === "partial" ? "secondary" : "destructive"
                            }
                          >
                            {day.status === "complete" ? "Completo" : 
                             day.status === "partial" ? "Parcial" : "Incompleto"}
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
          {data.dailyRecords.some(day => day.delayMinutes > 0) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Atenção: O funcionário possui atrasos registrados no período.
              </AlertDescription>
            </Alert>
          )}

          {data.dailyRecords.some(day => day.earlyDepartureMinutes > 0) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Atenção: O funcionário possui saídas antecipadas registradas no período.
              </AlertDescription>
            </Alert>
          )}

          {data.dailyRecords.some(day => day.overtimeMinutes > 120) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Atenção: O funcionário possui horas extras excessivas (mais de 2h por dia).
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
} 