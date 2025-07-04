"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, AlertTriangle, Info, CalendarIcon } from "lucide-react";

interface AFDReportProps {
  companyId?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
}

interface AFDData {
  content: string;
  filename: string;
  recordCount: number;
  employeeCount: number;
}

export function AFDReport({ companyId }: AFDReportProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
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
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AFDData | null>(null);

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

  const handleGenerateAFD = async () => {
    if (!companyId) {
      setError("ID da empresa é obrigatório");
      return;
    }

    if (!startDate || !endDate) {
      setError("Selecione o período");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reports/afd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          employeeId: selectedEmployeeId || undefined,
          startDate,
          endDate,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Erro ao gerar arquivo AFD");
        return;
      }

      setData(result.data);
    } catch {
      setError("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAFD = () => {
    if (!data) return;

    const blob = new Blob([data.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = data.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatAFDPreview = (content: string) => {
    const lines = content.split("\r\n");
    return lines.map((line, index) => {
      const type = line.charAt(0);
      let description = "";
      
      switch (type) {
        case "1":
          description = "Cabeçalho do Arquivo";
          break;
        case "2":
          description = "Cabeçalho do Relatório";
          break;
        case "3":
          description = "Registro de Ponto";
          break;
        case "4":
          description = "Totalizador";
          break;
        case "5":
          description = "Trailer do Arquivo";
          break;
        default:
          description = "Registro Desconhecido";
      }

      return (
        <div key={index} className="font-mono text-xs p-1 border-b border-gray-200">
          <span className="text-blue-600 font-semibold">{type}</span>
          <span className="text-gray-600 ml-2">({description})</span>
          <span className="text-gray-800 ml-2">{line}</span>
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exportação AFD para Fiscalização
          </CardTitle>
          <CardDescription>
            Gere o arquivo AFD (Arquivo de Fonte de Dados) conforme Portaria 671/2021 para fiscalização
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Funcionário (Opcional)</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os funcionários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os funcionários</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleGenerateAFD} disabled={isLoading}>
              {isLoading ? "Gerando..." : "Gerar Arquivo AFD"}
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

      {/* Informações sobre AFD */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Arquivo AFD:</strong> Formato obrigatório para fiscalização conforme Portaria 671/2021. 
          Contém cabeçalho, registros de ponto, totalizadores e trailer do arquivo.
        </AlertDescription>
      </Alert>

      {data && (
        <div className="space-y-6">
          {/* Resumo do Arquivo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Resumo do Arquivo AFD
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.filename}
                  </div>
                  <div className="text-sm text-muted-foreground">Nome do Arquivo</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {data.recordCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Registros de Ponto</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {data.employeeCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Funcionários</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {data.content.split("\r\n").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Linhas Totais</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview do Arquivo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Preview do Arquivo AFD
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                <div className="space-y-1">
                  {formatAFDPreview(data.content)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Download */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download do Arquivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Arquivo pronto para download e envio para fiscalização
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formato: {data.filename}
                  </p>
                </div>
                <Button onClick={handleDownloadAFD} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download AFD
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Estrutura do AFD */}
          <Card>
            <CardHeader>
              <CardTitle>Estrutura do Arquivo AFD</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">1</Badge>
                  <span>Cabeçalho do Arquivo - Informações da empresa e período</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">2</Badge>
                  <span>Cabeçalho do Relatório - Dados do relatório</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">3</Badge>
                  <span>Registros de Ponto - Entrada, saída, intervalos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">4</Badge>
                  <span>Totalizador - Quantidade de registros</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">5</Badge>
                  <span>Trailer do Arquivo - Total de linhas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 