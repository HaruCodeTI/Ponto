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
import { CalendarIcon, User, Clock, TrendingUp, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { exportWorkScheduleAnalysisToPDF } from "@/lib/pdf-export";

interface WorkScheduleAnalysisProps {
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
  weeklySchedule?: any;
}

interface DayRecord {
  id: string;
  type: string;
  time: string;
  timestamp: string;
}

interface DailyAnalysis {
  date: string;
  dateFormatted: string;
  dayOfWeek: number;
  dayName: string;
  records: DayRecord[];
  entryTime: string | null;
  exitTime: string | null;
  breakStartTime: string | null;
  breakEndTime: string | null;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  contractedHours: number;
  deviation: number;
  status: string;
  totalWorkFormatted: string;
  totalBreakFormatted: string;
  contractedHoursFormatted: string;
  deviationFormatted: string;
}

interface WeeklyAnalysis {
  week: string;
  weekFormatted: string;
  days: DailyAnalysis[];
  totalContractedHours: number;
  totalWorkedHours: number;
  totalOvertime: number;
  totalShortage: number;
  complianceRate: number;
}

interface WorkScheduleAnalysisData {
  employee: Employee;
  period: {
    startDate: string;
    endDate: string;
    reportPeriod: string;
  };
  workScheduleAnalysis: {
    daily: DailyAnalysis[];
    weekly: WeeklyAnalysis[];
    totalDays: number;
    workDays: number;
    complianceRate: number;
    totalContractedHours: number;
    totalWorkedHours: number;
    totalOvertime: number;
    totalShortage: number;
    averageDeviation: number;
    totalContractedHoursFormatted: string;
    totalWorkedHoursFormatted: string;
    totalOvertimeFormatted: string;
    totalShortageFormatted: string;
    averageDeviationFormatted: string;
  };
  summary: {
    totalDays: number;
    workDays: number;
    complianceRate: number;
    totalContractedHours: number;
    totalWorkedHours: number;
    totalOvertime: number;
    totalShortage: number;
    averageDeviation: number;
  };
}

export function WorkScheduleAnalysis({ companyId }: WorkScheduleAnalysisProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
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
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<WorkScheduleAnalysisData | null>(null);
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

    if (reportType === "month" && !month) {
      setError("Selecione um mês");
      return;
    }

    if (reportType === "period" && (!startDate || !endDate)) {
      setError("Selecione o período");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reports/work-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          employeeId: selectedEmployeeId,
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
    if (!data) return;
    
    const wsData = [
      [
        "Data",
        "Dia da Semana",
        "Entrada",
        "Saída",
        "Pausa",
        "Horas Contratadas",
        "Horas Trabalhadas",
        "Desvio",
        "Status"
      ],
      ...data.workScheduleAnalysis.daily.map((day) => [
        day.dateFormatted,
        day.dayName,
        day.entryTime || "-",
        day.exitTime || "-",
        day.breakStartTime && day.breakEndTime ? `${day.breakStartTime} - ${day.breakEndTime}` : "-",
        day.contractedHoursFormatted,
        day.totalWorkFormatted,
        day.deviationFormatted,
        day.status === "compliant" ? "Conforme" : day.status === "overtime" ? "Horas Extras" : day.status === "shortage" ? "Faltou" : "Incompleto"
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Análise de Jornada");
    XLSX.writeFile(wb, `analise-jornada-${data.employee.name}-${data.period.reportPeriod}.xlsx`);
  };

  const handleExportCSV = () => {
    if (!data) return;
    
    const csvData = [
      [
        "Data",
        "Dia da Semana",
        "Entrada",
        "Saída",
        "Pausa",
        "Horas Contratadas",
        "Horas Trabalhadas",
        "Desvio",
        "Status"
      ],
      ...data.workScheduleAnalysis.daily.map((day) => [
        day.dateFormatted,
        day.dayName,
        day.entryTime || "-",
        day.exitTime || "-",
        day.breakStartTime && day.breakEndTime ? `${day.breakStartTime} - ${day.breakEndTime}` : "-",
        day.contractedHoursFormatted,
        day.totalWorkFormatted,
        day.deviationFormatted,
        day.status === "compliant" ? "Conforme" : day.status === "overtime" ? "Horas Extras" : day.status === "shortage" ? "Faltou" : "Incompleto"
      ])
    ];

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `analise-jornada-${data.employee.name}-${data.period.reportPeriod}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!data) return;
    exportWorkScheduleAnalysisToPDF(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Análise de Jornada Contratada
          </CardTitle>
          <CardDescription>
            Compare a jornada contratada com as horas efetivamente trabalhadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <div>
                  <Label className="text-sm font-medium">Tolerância</Label>
                  <p className="text-lg">{data.employee.toleranceMinutes}min</p>
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
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.summary.workDays}
                  </div>
                  <div className="text-sm text-muted-foreground">Dias Trabalhados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {data.workScheduleAnalysis.totalContractedHoursFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">Horas Contratadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {data.workScheduleAnalysis.totalWorkedHoursFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">Horas Trabalhadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {data.workScheduleAnalysis.totalOvertimeFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">Horas Extras</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {data.workScheduleAnalysis.totalShortageFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">Faltou</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Taxa de Conformidade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Taxa de Conformidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-4xl font-bold ${
                  data.summary.complianceRate >= 95 ? "text-green-600" :
                  data.summary.complianceRate >= 80 ? "text-yellow-600" : "text-red-600"
                }`}>
                  {data.summary.complianceRate}%
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {data.summary.complianceRate >= 95 ? "Excelente conformidade" :
                   data.summary.complianceRate >= 80 ? "Boa conformidade" : "Conformidade baixa"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Análise Diária */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Análise Diária ({data.workScheduleAnalysis.daily.length} dias)
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
                      <TableHead className="text-right">Contratadas</TableHead>
                      <TableHead className="text-right">Trabalhadas</TableHead>
                      <TableHead className="text-right">Desvio</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.workScheduleAnalysis.daily.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell className="font-medium">
                          {day.dateFormatted}
                        </TableCell>
                        <TableCell className="capitalize">
                          {day.dayName}
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
                            {day.contractedHoursFormatted}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">
                            {day.totalWorkFormatted}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={
                              day.status === "compliant" ? "default" : 
                              day.status === "overtime" ? "secondary" : "destructive"
                            }
                          >
                            {day.deviationFormatted}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {day.status === "compliant" ? (
                            <Badge variant="default" className="text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Conforme
                            </Badge>
                          ) : day.status === "overtime" ? (
                            <Badge variant="secondary" className="text-orange-600">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Horas Extras
                            </Badge>
                          ) : day.status === "shortage" ? (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Faltou
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              Incompleto
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Alertas */}
          {data.summary.complianceRate < 80 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Atenção: A taxa de conformidade está baixa ({data.summary.complianceRate}%). 
                Recomenda-se revisar a jornada de trabalho do funcionário.
              </AlertDescription>
            </Alert>
          )}

          {data.workScheduleAnalysis.totalOvertime > 20 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Atenção: O funcionário acumulou muitas horas extras ({data.workScheduleAnalysis.totalOvertimeFormatted}) no período.
              </AlertDescription>
            </Alert>
          )}

          {data.workScheduleAnalysis.totalShortage > 10 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Atenção: O funcionário tem muitas horas em falta ({data.workScheduleAnalysis.totalShortageFormatted}) no período.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
} 