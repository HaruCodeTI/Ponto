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
import { CalendarIcon, User, MapPin, Navigation, AlertTriangle, TrendingUp } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { exportLocationHistoryToPDF } from "@/lib/pdf-export";

interface LocationHistoryProps {
  companyId?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  workSchedule: string;
}

interface LocationRecord {
  id: string;
  type: string;
  timestamp: string;
  date: string;
  time: string;
  device: string;
  ipAddress: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  records: LocationRecord[];
  totalVisits: number;
  firstVisit: string;
  lastVisit: string;
  averageTimeSpent: number;
  totalTimeSpent: number;
  totalTimeSpentFormatted: string;
  averageTimeSpentFormatted: string;
}

interface DailyData {
  date: string;
  dateFormatted: string;
  dayOfWeek: string;
  locations: string[];
  totalRecords: number;
  uniqueLocations: number;
  totalDistance: number;
  totalDistanceFormatted: string;
}

interface LocationHistoryData {
  employee: Employee;
  period: {
    startDate: string;
    endDate: string;
    reportPeriod: string;
  };
  locationHistory: {
    locations: LocationData[];
    daily: DailyData[];
  };
  statistics: {
    totalDays: number;
    totalRecords: number;
    averageRecordsPerDay: number;
    mostFrequentLocation: LocationData | null;
    totalDistance: number;
    averageDistancePerDay: number;
    totalDistanceFormatted: string;
    averageDistancePerDayFormatted: string;
  };
  summary: {
    totalRecords: number;
    totalLocations: number;
    totalDays: number;
    averageRecordsPerDay: number;
    mostFrequentLocation: LocationData | null;
    totalDistance: number;
    averageDistancePerDay: number;
  };
}

export function LocationHistory({ companyId }: LocationHistoryProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [startDate, setStartDate] = useState(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return thirtyDaysAgo.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<LocationHistoryData | null>(null);
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

    if (!startDate || !endDate) {
      setError("Selecione o período");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reports/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          employeeId: selectedEmployeeId,
          startDate,
          endDate,
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
        "Localização",
        "Endereço",
        "Latitude",
        "Longitude",
        "Horário",
        "Tipo",
        "Dispositivo",
        "IP"
      ],
      ...data.locationHistory.locations.flatMap(location =>
        location.records.map(record => [
          record.date,
          new Date(record.date).toLocaleDateString("pt-BR", { weekday: "long" }),
          `${location.latitude}, ${location.longitude}`,
          location.address,
          location.latitude,
          location.longitude,
          record.time,
          record.type,
          record.device,
          record.ipAddress
        ])
      )
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Histórico de Localizações");
    XLSX.writeFile(wb, `historico-localizacoes-${data.employee.name}-${data.period.reportPeriod}.xlsx`);
  };

  const handleExportCSV = () => {
    if (!data) return;
    
    const csvData = [
      [
        "Data",
        "Dia da Semana",
        "Localização",
        "Endereço",
        "Latitude",
        "Longitude",
        "Horário",
        "Tipo",
        "Dispositivo",
        "IP"
      ],
      ...data.locationHistory.locations.flatMap(location =>
        location.records.map(record => [
          record.date,
          new Date(record.date).toLocaleDateString("pt-BR", { weekday: "long" }),
          `${location.latitude}, ${location.longitude}`,
          location.address,
          location.latitude,
          location.longitude,
          record.time,
          record.type,
          record.device,
          record.ipAddress
        ])
      )
    ];

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `historico-localizacoes-${data.employee.name}-${data.period.reportPeriod}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!data) return;
    exportLocationHistoryToPDF(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Histórico de Localizações
          </CardTitle>
          <CardDescription>
            Relatório detalhado de localizações e deslocamentos do funcionário
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
                    {data.summary.totalLocations}
                  </div>
                  <div className="text-sm text-muted-foreground">Locais Únicos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {data.summary.totalRecords}
                  </div>
                  <div className="text-sm text-muted-foreground">Registros</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {data.statistics.totalDistanceFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">Distância Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {data.statistics.averageDistancePerDayFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">Média por Dia</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localização Mais Frequente */}
          {data.statistics.mostFrequentLocation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Localização Mais Frequente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Endereço</Label>
                    <p className="text-lg">{data.statistics.mostFrequentLocation.address}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Coordenadas</Label>
                    <p className="text-lg">
                      {data.statistics.mostFrequentLocation.latitude.toFixed(6)}, {data.statistics.mostFrequentLocation.longitude.toFixed(6)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Visitas</Label>
                    <p className="text-lg font-semibold">{data.statistics.mostFrequentLocation.totalVisits}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico de Localizações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Histórico de Localizações ({data.locationHistory.locations.length} locais)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Coordenadas</TableHead>
                      <TableHead className="text-right">Visitas</TableHead>
                      <TableHead className="text-right">Tempo Total</TableHead>
                      <TableHead className="text-right">Tempo Médio</TableHead>
                      <TableHead>Primeira Visita</TableHead>
                      <TableHead>Última Visita</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.locationHistory.locations.map((location, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {location.address}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">
                            {location.totalVisits}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">
                            {location.totalTimeSpentFormatted}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">
                            {location.averageTimeSpentFormatted}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(location.firstVisit).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          {new Date(location.lastVisit).toLocaleDateString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Histórico Diário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Histórico Diário ({data.locationHistory.daily.length} dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Dia</TableHead>
                      <TableHead className="text-right">Registros</TableHead>
                      <TableHead className="text-right">Locais Únicos</TableHead>
                      <TableHead className="text-right">Distância</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.locationHistory.daily.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell className="font-medium">
                          {day.dateFormatted}
                        </TableCell>
                        <TableCell className="capitalize">
                          {day.dayOfWeek}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">
                            {day.totalRecords}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">
                            {day.uniqueLocations}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">
                            {day.totalDistanceFormatted}
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
          {data.statistics.totalDistance > 100 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Atenção: O funcionário percorreu uma distância significativa ({data.statistics.totalDistanceFormatted}) no período.
              </AlertDescription>
            </Alert>
          )}

          {data.locationHistory.locations.length > 10 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Atenção: O funcionário frequentou muitos locais diferentes ({data.locationHistory.locations.length}) no período.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
} 