"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, User, CalendarIcon, AlertTriangle, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { exportToPDF } from "@/lib/pdf-export";

interface MirrorReportProps {
  companyId?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  cpf: string;
}

interface Company {
  name: string;
  cnpj: string;
}

interface Month {
  period: string;
  periodFormatted: string;
  totalWorkDays: number;
  totalHours: number;
  totalAbsences: number;
}

interface DailyEntry {
  date: string;
  dateFormatted: string;
  dayOfWeek: number;
  dayName: string;
  entryTime: string | null;
  exitTime: string | null;
  breakStartTime: string | null;
  breakEndTime: string | null;
  totalHours: number;
  observations: string;
}

interface MirrorData {
  employee: Employee;
  company: Company;
  month: Month;
  dailyEntries: DailyEntry[];
  generatedAt: string;
}

export function MirrorReport({ companyId }: MirrorReportProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MirrorData | null>(null);

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

    if (!month) {
      setError("Selecione um mês");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reports/mirror", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          employeeId: selectedEmployeeId,
          month,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Erro ao gerar espelho de ponto");
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
        "ESPELHO DE PONTO MENSAL",
        "",
        "",
        "",
        "",
        ""
      ],
      [
        `Funcionário: ${data.employee.name}`,
        "",
        "",
        "",
        "",
        ""
      ],
      [
        `CPF: ${data.employee.cpf}`,
        "",
        "",
        "",
        "",
        ""
      ],
      [
        `Cargo: ${data.employee.position}`,
        "",
        "",
        "",
        "",
        ""
      ],
      [
        `Empresa: ${data.company.name}`,
        "",
        "",
        "",
        "",
        ""
      ],
      [
        `CNPJ: ${data.company.cnpj}`,
        "",
        "",
        "",
        "",
        ""
      ],
      [
        `Período: ${data.month.periodFormatted}`,
        "",
        "",
        "",
        "",
        ""
      ],
      [
        "",
        "",
        "",
        "",
        "",
        ""
      ],
      [
        "Data",
        "Dia da Semana",
        "Entrada",
        "Saída",
        "Pausa",
        "Total de Horas",
        "Observações"
      ],
      ...data.dailyEntries.map((day) => [
        day.dateFormatted,
        day.dayName,
        day.entryTime || "-",
        day.exitTime || "-",
        day.breakStartTime && day.breakEndTime ? `${day.breakStartTime} - ${day.breakEndTime}` : "-",
        day.totalHours > 0 ? `${day.totalHours}h` : "-",
        day.observations
      ]),
      [
        "",
        "",
        "",
        "",
        "",
        "",
        ""
      ],
      [
        "RESUMO MENSAL",
        "",
        "",
        "",
        "",
        "",
        ""
      ],
      [
        `Dias Trabalhados: ${data.month.totalWorkDays}`,
        "",
        "",
        "",
        "",
        "",
        ""
      ],
      [
        `Total de Horas: ${data.month.totalHours}h`,
        "",
        "",
        "",
        "",
        "",
        ""
      ],
      [
        `Faltas: ${data.month.totalAbsences}`,
        "",
        "",
        "",
        "",
        "",
        ""
      ],
      [
        "",
        "",
        "",
        "",
        "",
        "",
        ""
      ],
      [
        `Gerado em: ${new Date(data.generatedAt).toLocaleDateString("pt-BR")} às ${new Date(data.generatedAt).toLocaleTimeString("pt-BR")}`,
        "",
        "",
        "",
        "",
        "",
        ""
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Espelho de Ponto");
    XLSX.writeFile(wb, `espelho-ponto-${data.employee.name}-${data.month.period}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!data) return;
    
    const headers = [
      "Data",
      "Dia da Semana",
      "Entrada",
      "Saída",
      "Pausa",
      "Total de Horas",
      "Observações"
    ];

    const tableData = data.dailyEntries.map((day) => [
      day.dateFormatted,
      day.dayName,
      day.entryTime || "-",
      day.exitTime || "-",
      day.breakStartTime && day.breakEndTime ? `${day.breakStartTime} - ${day.breakEndTime}` : "-",
      day.totalHours > 0 ? `${day.totalHours}h` : "-",
      day.observations
    ]);

    exportToPDF({
      title: "Espelho de Ponto Mensal",
      subtitle: `${data.employee.name} - ${data.employee.position}`,
      companyName: data.company.name,
      period: data.month.periodFormatted,
      data: tableData,
      headers,
      filename: `espelho-ponto-${data.employee.name}-${data.month.period}.pdf`,
      orientation: "portrait"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Espelho de Ponto Mensal
          </CardTitle>
          <CardDescription>
            Gere o espelho de ponto mensal conforme Portaria 671/2021 (obrigatório)
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
              <Label htmlFor="month">Mês</Label>
              <Input
                id="month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleGenerateReport} disabled={isLoading}>
              {isLoading ? "Gerando..." : "Gerar Espelho de Ponto"}
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
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>

          {/* Cabeçalho do Espelho */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-lg">
                ESPELHO DE PONTO MENSAL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-semibold">Funcionário:</Label>
                  <p>{data.employee.name}</p>
                  <Label className="font-semibold">CPF:</Label>
                  <p>{data.employee.cpf}</p>
                  <Label className="font-semibold">Cargo:</Label>
                  <p>{data.employee.position}</p>
                </div>
                <div>
                  <Label className="font-semibold">Empresa:</Label>
                  <p>{data.company.name}</p>
                  <Label className="font-semibold">CNPJ:</Label>
                  <p>{data.company.cnpj}</p>
                  <Label className="font-semibold">Período:</Label>
                  <p>{data.month.periodFormatted}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela do Espelho */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Registros Diários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Dia da Semana</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead>Pausa</TableHead>
                      <TableHead className="text-right">Total de Horas</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.dailyEntries.map((day) => (
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
                          {day.totalHours > 0 ? (
                            <Badge variant="outline">
                              {day.totalHours}h
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              day.observations === "Normal" ? "default" : 
                              day.observations.includes("Falta") ? "destructive" : "secondary"
                            }
                          >
                            {day.observations}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Resumo Mensal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Resumo Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.month.totalWorkDays}
                  </div>
                  <div className="text-sm text-muted-foreground">Dias Trabalhados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {data.month.totalHours}h
                  </div>
                  <div className="text-sm text-muted-foreground">Total de Horas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {data.month.totalAbsences}
                  </div>
                  <div className="text-sm text-muted-foreground">Faltas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rodapé */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-sm text-muted-foreground">
                <p>Documento gerado em: {new Date(data.generatedAt).toLocaleDateString("pt-BR")} às {new Date(data.generatedAt).toLocaleTimeString("pt-BR")}</p>
                <p>Conforme Portaria 671/2021 - Ministério do Trabalho e Previdência</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 