"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Save, Trash2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface FormatConfigProps {
  companyId: string;
}

interface FormatConfigData {
  id?: string;
  companyId: string;
  reportType: string;
  defaultFormat: "EXCEL" | "CSV" | "PDF" | "AFD";
  enabledFormats: string[];
  customSettings?: any;
  createdAt?: string;
  updatedAt?: string;
}

const reportTypes = [
  { value: "monthly", label: "Relatório Mensal Geral" },
  { value: "individual", label: "Relatório Individual Diário" },
  { value: "productivity", label: "Relatório de Produtividade" },
  { value: "locations", label: "Histórico de Localizações" },
  { value: "work-schedule", label: "Análise de Jornada Contratada" },
  { value: "mirror", label: "Espelho de Ponto Mensal" },
  { value: "afd", label: "Arquivo AFD" },
  { value: "hours", label: "Relatório de Horas" },
];

const availableFormats = [
  { value: "EXCEL", label: "Excel (.xlsx)", icon: "📊" },
  { value: "CSV", label: "CSV (.csv)", icon: "📋" },
  { value: "PDF", label: "PDF (.pdf)", icon: "📄" },
  { value: "AFD", label: "AFD (.afd)", icon: "📁" },
];

const formatRestrictions = {
  monthly: ["EXCEL", "CSV", "PDF"],
  individual: ["EXCEL", "CSV", "PDF"],
  productivity: ["EXCEL", "CSV", "PDF"],
  locations: ["EXCEL", "CSV", "PDF"],
  "work-schedule": ["EXCEL", "CSV", "PDF"],
  mirror: ["PDF", "EXCEL"],
  afd: ["AFD"],
  hours: ["EXCEL", "CSV", "PDF"],
};

export function FormatConfig({ companyId }: FormatConfigProps) {
  const [configs, setConfigs] = useState<FormatConfigData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState("monthly");
  const [formData, setFormData] = useState<Partial<FormatConfigData>>({
    companyId,
    reportType: "monthly",
    defaultFormat: "EXCEL",
    enabledFormats: ["EXCEL", "CSV"],
  });

  useEffect(() => {
    loadConfigs();
  }, [companyId]);

  useEffect(() => {
    const currentConfig = configs.find(c => c.reportType === selectedReportType);
    if (currentConfig) {
      setFormData(currentConfig);
    } else {
      setFormData({
        companyId,
        reportType: selectedReportType,
        defaultFormat: "EXCEL",
        enabledFormats: formatRestrictions[selectedReportType as keyof typeof formatRestrictions] || ["EXCEL"],
      });
    }
  }, [selectedReportType, configs]);

  const loadConfigs = async () => {
    try {
      const response = await fetch(`/api/reports/format-config?companyId=${companyId}`);
      const data = await response.json();
      
      if (data.success) {
        setConfigs(data.data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const handleSave = async () => {
    if (!formData.enabledFormats || formData.enabledFormats.length === 0) {
      toast.error("Pelo menos um formato deve estar habilitado");
      return;
    }

    if (!formData.defaultFormat) {
      toast.error("Formato padrão é obrigatório");
      return;
    }

    if (!formData.enabledFormats.includes(formData.defaultFormat)) {
      toast.error("O formato padrão deve estar entre os formatos habilitados");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/reports/format-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Configuração salva com sucesso!");
        await loadConfigs();
      } else {
        toast.error(data.error || "Erro ao salvar configuração");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro interno do servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja remover a configuração de formato?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/reports/format-config?companyId=${companyId}&reportType=${selectedReportType}`, {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Configuração removida com sucesso!");
        await loadConfigs();
      } else {
        toast.error(data.error || "Erro ao remover configuração");
      }
    } catch (error) {
      console.error("Erro ao remover:", error);
      toast.error("Erro interno do servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFormat = (format: string) => {
    const currentFormats = formData.enabledFormats || [];
    let newFormats: string[];

    if (currentFormats.includes(format)) {
      newFormats = currentFormats.filter(f => f !== format);
    } else {
      newFormats = [...currentFormats, format];
    }

    setFormData(prev => ({
      ...prev,
      enabledFormats: newFormats,
      defaultFormat: newFormats.includes(prev.defaultFormat || "") 
        ? prev.defaultFormat 
        : newFormats[0] as any,
    }));
  };

  const getAvailableFormatsForReport = (reportType: string) => {
    return availableFormats.filter(format => 
      formatRestrictions[reportType as keyof typeof formatRestrictions]?.includes(format.value as any)
    );
  };

  const getFormatLabel = (format: string) => {
    return availableFormats.find(f => f.value === format)?.label || format;
  };

  const hasConfig = (reportType: string) => {
    return configs.some(c => c.reportType === reportType);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Configuração de Formatos
        </CardTitle>
        <CardDescription>
          Configure os formatos disponíveis para cada tipo de relatório
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={selectedReportType} onValueChange={setSelectedReportType} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            {reportTypes.map((type) => (
              <TabsTrigger key={type.value} value={type.value} className="text-xs">
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {reportTypes.map((type) => (
            <TabsContent key={type.value} value={type.value} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{type.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure os formatos disponíveis para este relatório
                  </p>
                </div>
                {hasConfig(type.value) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Configurado
                  </Badge>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Formatos Habilitados</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {getAvailableFormatsForReport(type.value).map((format) => (
                      <div key={format.value} className="flex items-center space-x-2">
                        <Switch
                          checked={formData.enabledFormats?.includes(format.value)}
                          onCheckedChange={() => toggleFormat(format.value)}
                        />
                        <Label className="text-sm flex items-center gap-1">
                          <span>{format.icon}</span>
                          {format.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="defaultFormat">Formato Padrão</Label>
                  <Select 
                    value={formData.defaultFormat} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, defaultFormat: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o formato padrão" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.enabledFormats?.map((format) => (
                        <SelectItem key={format} value={format}>
                          {getFormatLabel(format)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Formatos disponíveis para {type.label}:</strong><br />
                    {getAvailableFormatsForReport(type.value).map(f => f.label).join(", ")}
                    {type.value === "afd" && " (Apenas AFD conforme legislação)"}
                    {type.value === "mirror" && " (PDF obrigatório, Excel opcional)"}
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Salvando..." : "Salvar Configuração"}
                  </Button>
                  {hasConfig(type.value) && (
                    <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Separator />

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Resumo das Configurações</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map((type) => {
              const config = configs.find(c => c.reportType === type.value);
              return (
                <div key={type.value} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{type.label}</span>
                    {config ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  {config ? (
                    <div className="text-xs text-muted-foreground">
                      <div>Padrão: {getFormatLabel(config.defaultFormat)}</div>
                      <div>Habilitados: {config.enabledFormats.map(f => getFormatLabel(f)).join(", ")}</div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Configuração padrão
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 